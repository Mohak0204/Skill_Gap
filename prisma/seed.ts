import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const skills = [
    // Programming Languages
    { name: 'JavaScript', category: 'programming_language', aliases: 'js,ES6,ES2015,ECMAScript' },
    { name: 'TypeScript', category: 'programming_language', aliases: 'ts' },
    { name: 'Python', category: 'programming_language', aliases: 'python3,py' },
    { name: 'Java', category: 'programming_language', aliases: 'java8,java11,java17' },
    { name: 'C#', category: 'programming_language', aliases: 'csharp,c-sharp,.net' },
    { name: 'Go', category: 'programming_language', aliases: 'golang' },
    { name: 'Rust', category: 'programming_language', aliases: '' },
    { name: 'Ruby', category: 'programming_language', aliases: 'rb' },
    { name: 'PHP', category: 'programming_language', aliases: '' },
    { name: 'Swift', category: 'programming_language', aliases: '' },
    { name: 'Kotlin', category: 'programming_language', aliases: '' },
    { name: 'C++', category: 'programming_language', aliases: 'cpp' },
    { name: 'C', category: 'programming_language', aliases: '' },
    { name: 'Scala', category: 'programming_language', aliases: '' },
    { name: 'SQL', category: 'programming_language', aliases: '' },
    { name: 'HTML', category: 'programming_language', aliases: 'html5' },
    { name: 'CSS', category: 'programming_language', aliases: 'css3' },

    // Frameworks & Libraries
    { name: 'React', category: 'framework', aliases: 'react.js,reactjs' },
    { name: 'Next.js', category: 'framework', aliases: 'nextjs,next' },
    { name: 'Vue.js', category: 'framework', aliases: 'vue,vuejs' },
    { name: 'Angular', category: 'framework', aliases: 'angularjs' },
    { name: 'Node.js', category: 'framework', aliases: 'node,nodejs' },
    { name: 'Express.js', category: 'framework', aliases: 'express,expressjs' },
    { name: 'Django', category: 'framework', aliases: '' },
    { name: 'Flask', category: 'framework', aliases: '' },
    { name: 'FastAPI', category: 'framework', aliases: '' },
    { name: 'Spring Boot', category: 'framework', aliases: 'spring,spring-boot' },
    { name: 'Ruby on Rails', category: 'framework', aliases: 'rails,ror' },
    { name: 'Laravel', category: 'framework', aliases: '' },
    { name: 'Tailwind CSS', category: 'framework', aliases: 'tailwind,tailwindcss' },
    { name: 'Bootstrap', category: 'framework', aliases: '' },
    { name: 'Svelte', category: 'framework', aliases: 'sveltekit' },
    { name: '.NET', category: 'framework', aliases: 'dotnet,asp.net' },

    // Databases
    { name: 'PostgreSQL', category: 'database', aliases: 'postgres,pg' },
    { name: 'MySQL', category: 'database', aliases: 'mariadb' },
    { name: 'MongoDB', category: 'database', aliases: 'mongo' },
    { name: 'Redis', category: 'database', aliases: '' },
    { name: 'SQLite', category: 'database', aliases: '' },
    { name: 'Elasticsearch', category: 'database', aliases: 'elastic,es' },
    { name: 'DynamoDB', category: 'database', aliases: '' },
    { name: 'Cassandra', category: 'database', aliases: '' },
    { name: 'Firebase', category: 'database', aliases: 'firestore' },
    { name: 'Prisma', category: 'database', aliases: 'prisma-orm' },
    { name: 'GraphQL', category: 'database', aliases: '' },

    // Cloud & Infrastructure
    { name: 'AWS', category: 'cloud', aliases: 'amazon web services,amazon' },
    { name: 'Azure', category: 'cloud', aliases: 'microsoft azure' },
    { name: 'Google Cloud', category: 'cloud', aliases: 'gcp,google cloud platform' },
    { name: 'Vercel', category: 'cloud', aliases: '' },
    { name: 'Netlify', category: 'cloud', aliases: '' },
    { name: 'Heroku', category: 'cloud', aliases: '' },
    { name: 'DigitalOcean', category: 'cloud', aliases: '' },

    // DevOps
    { name: 'Docker', category: 'devops', aliases: 'containerization,container' },
    { name: 'Kubernetes', category: 'devops', aliases: 'k8s' },
    { name: 'CI/CD', category: 'devops', aliases: 'continuous integration,continuous deployment,cicd' },
    { name: 'GitHub Actions', category: 'devops', aliases: 'gha' },
    { name: 'Jenkins', category: 'devops', aliases: '' },
    { name: 'Terraform', category: 'devops', aliases: 'iac,infrastructure as code' },
    { name: 'Ansible', category: 'devops', aliases: '' },
    { name: 'Linux', category: 'devops', aliases: 'unix,bash,shell' },
    { name: 'Nginx', category: 'devops', aliases: '' },
    { name: 'Git', category: 'devops', aliases: 'github,gitlab,version control' },

    // Testing
    { name: 'Jest', category: 'testing', aliases: '' },
    { name: 'Vitest', category: 'testing', aliases: '' },
    { name: 'Pytest', category: 'testing', aliases: '' },
    { name: 'Cypress', category: 'testing', aliases: '' },
    { name: 'Playwright', category: 'testing', aliases: '' },
    { name: 'Selenium', category: 'testing', aliases: '' },
    { name: 'Testing', category: 'testing', aliases: 'unit testing,integration testing,test-driven development,tdd' },

    // Architecture & Patterns
    { name: 'REST API', category: 'architecture', aliases: 'rest,restful,api design' },
    { name: 'Microservices', category: 'architecture', aliases: 'microservice architecture' },
    { name: 'System Design', category: 'architecture', aliases: 'system architecture,distributed systems' },
    { name: 'Design Patterns', category: 'architecture', aliases: 'software patterns,oop patterns' },
    { name: 'Event-Driven', category: 'architecture', aliases: 'event sourcing,message queue' },

    // Soft Skills
    { name: 'Agile', category: 'soft_skill', aliases: 'scrum,kanban,sprint planning' },
    { name: 'Communication', category: 'soft_skill', aliases: 'written communication,verbal communication' },
    { name: 'Leadership', category: 'soft_skill', aliases: 'team lead,tech lead,mentoring' },
    { name: 'Problem Solving', category: 'soft_skill', aliases: 'analytical thinking,critical thinking' },
    { name: 'Collaboration', category: 'soft_skill', aliases: 'teamwork,cross-functional' },

    // Other
    { name: 'Machine Learning', category: 'other', aliases: 'ml,deep learning,ai' },
    { name: 'Data Science', category: 'other', aliases: 'data analysis,data analytics' },
    { name: 'Security', category: 'other', aliases: 'cybersecurity,appsec,owasp' },
    { name: 'OAuth', category: 'other', aliases: 'oauth2,openid,authentication' },
    { name: 'WebSocket', category: 'other', aliases: 'real-time,socket' },
    { name: 'Build Tools', category: 'other', aliases: 'webpack,vite,rollup,esbuild' },
    { name: 'Environment Configuration', category: 'other', aliases: 'env config,dotenv' },
]

async function main() {
    console.log('Seeding database with skills...')

    for (const skill of skills) {
        await prisma.skill.upsert({
            where: { name: skill.name },
            update: { aliases: skill.aliases, category: skill.category },
            create: skill,
        })
    }

    console.log(`Seeded ${skills.length} skills.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
