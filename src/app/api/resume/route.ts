import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { enqueueJob } from '@/jobs/jobRunner'
import { getJobStatus } from '@/jobs/jobRunner'
import { confirmResumeExtraction } from '@/jobs/handlers/extractResumeHandler'
import { confirmResumeSchema } from '@/lib/validation/schemas'
import { ValidationError } from '@/lib/errors'
// Register handler
import '@/jobs/handlers/extractResumeHandler'

export const POST = apiHandler(
    async (req: NextRequest, { userId }) => {
        const contentType = req.headers.get('content-type') || ''

        // Handle file upload or text submission
        let resumeText = ''

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData()
            const file = formData.get('resume') as File | null

            if (!file) throw new ValidationError('No resume file provided')

            if (file.size > 5 * 1024 * 1024) {
                throw new ValidationError('Resume file must be less than 5MB')
            }

            // Supported formats: .txt, .pdf (PDF needs pdf-parse)
            const name = file.name.toLowerCase()
            if (name.endsWith('.txt') || name.endsWith('.md')) {
                resumeText = await file.text()
            } else if (name.endsWith('.pdf')) {
                try {
                    const pdfParse = (await import('pdf-parse')).default
                    const buffer = Buffer.from(await file.arrayBuffer())
                    const pdfData = await pdfParse(buffer)
                    resumeText = pdfData.text
                } catch {
                    throw new ValidationError('Failed to parse PDF file. Please try uploading as .txt instead.')
                }
            } else {
                throw new ValidationError('Unsupported file format. Please upload .txt, .md, or .pdf')
            }
        } else {
            const body = await req.json()
            resumeText = body.resumeText

            if (!resumeText || typeof resumeText !== 'string') {
                throw new ValidationError('Resume text is required')
            }
        }

        // Enqueue extraction job
        const jobId = await enqueueJob('extract_resume', userId!, { resumeText })

        return NextResponse.json({ jobId }, { status: 202 })
    }
)

// PUT: Confirm resume extraction
export const PUT = apiHandler(
    async (req: NextRequest, { userId }) => {
        const body = await req.json()
        const { jobId, ...confirmData } = body

        if (!jobId) throw new ValidationError('jobId is required')

        const jobStatus = await getJobStatus(jobId)
        if (!jobStatus) throw new ValidationError('Job not found')
        if (jobStatus.status !== 'complete') {
            throw new ValidationError('Job has not completed yet')
        }

        const result = await confirmResumeExtraction(
            userId!,
            jobStatus.result,
            confirmData.skillIds || [],
            confirmData.projectIds || []
        )

        return NextResponse.json(result)
    }
)
