// Shared experience data with tech stack chips + normalized periods.
// Each period: { start: 'YYYY-MM', end: 'YYYY-MM' | null (Present) }
window.CV_EXPERIENCE = [
    {
        id: 'massive',
        period: '2024 — Present',
        start: '2024-01',
        end: null,
        role: 'Data Engineer',
        company: 'Massive Entertainment',
        companyNote: 'A Ubisoft Studio',
        companyUrl: 'https://www.massive.se/',
        location: 'Malmö, SE',
        logo: '../content/company-logos/massive-entertainment.png',
        accent: '#ff5f00',
        short: 'Leading data engineering for live game analytics and ML pipelines.',
        description:
            'Leading the data engineering efforts for live game analytics and ML pipelines.',
        achievements: [
            'Data ingestion and preprocessing for ML projects.',
            'Provide tools and templates for the developers in the Game Intelligence department.',
            'Applying big data optimisation practices (pyspark/SQL).',
            'Lead a storage and compute data migration from legacy tool to Databricks.',
        ],
        stack: [
            { label: 'PySpark', c: 'engineering' },
            { label: 'Databricks', c: 'cloud' },
            { label: 'SQL', c: 'engineering' },
            { label: 'ML Pipelines', c: 'ml' },
            { label: 'Azure', c: 'cloud' },
        ],
    },
    {
        id: 'follo',
        period: '2023 — 2024',
        start: '2023-03',
        end: '2024-01',
        role: 'Data Scientist / ML Engineer',
        company: 'MvH Media',
        companyNote: 'now Follo',
        companyUrl: 'https://folloagency.com/',
        location: 'Madrid, ES',
        logo: '../content/company-logos/follo.png',
        accent: '#1c0033',
        short: 'Building data products for online-marketing clients.',
        description:
            'Active python developer in the data team, building data products for clients in online marketing.',
        achievements: [
            'Built ETL pipelines for data collection and preprocessing using Airflow and Pandas.',
            'Creation of data warehouses using BigQuery and GCS, enabling efficient storage and retrieval of large-scale marketing data.',
            'API integration for data collection from various marketing platforms (Google Ads, Facebook Ads, etc.).',
            'Developed sentiment analysis models to analyze customer feedback using NLP techniques.',
            'Implementation of a Category and Product description text generator on Streamlit with a fine-tuned LLM.',
        ],
        stack: [
            { label: 'Airflow', c: 'engineering' },
            { label: 'BigQuery', c: 'cloud' },
            { label: 'GCP', c: 'cloud' },
            { label: 'NLP', c: 'nlp' },
            { label: 'Streamlit', c: 'analytics' },
            { label: 'LLM', c: 'nlp' },
        ],
    },
    {
        id: 'bnzsa',
        period: '2022 — 2023',
        start: '2022-05',
        end: '2023-03',
        role: 'Data Scientist',
        company: 'BNZSA',
        companyNote: 'now Anteriad',
        companyUrl: 'https://anteriad.com/',
        location: 'Madrid, ES',
        logo: '../content/company-logos/anteriad.png',
        accent: '#2aa3df',
        short: 'Decision Science team — data-driven solutions for business.',
        description:
            'Member of the Decision Science team, focusing on building data-driven solutions for business challenges.',
        achievements: [
            'Built a global data pipeline to collect, structure, validate, and clean data from CRM and ERP using Python and SQL.',
            'Propensity-score models to identify high-value customers for targeted marketing campaigns.',
            'Fine-tuned a Transformer to classify postal addresses by country — 83% success on the 21 most common countries.',
            'Developed a speech-to-text analysis tool to extract insights from customer service calls using NLP.',
        ],
        stack: [
            { label: 'Python', c: 'engineering' },
            { label: 'SQL', c: 'engineering' },
            { label: 'Transformers', c: 'nlp' },
            { label: 'NLP', c: 'nlp' },
            { label: 'Speech-to-Text', c: 'nlp' },
        ],
    },
    {
        id: 'becquet',
        period: '2020 — 2022',
        start: '2020-09',
        end: '2022-05',
        role: 'Junior Data Scientist',
        company: 'Becquet',
        companyNote: null,
        companyUrl: 'https://www.becquet.fr/',
        location: 'Roubaix, FR',
        logo: '../content/company-logos/becquet.png',
        accent: '#ff4f1a',
        short: 'Online Marketing — client scoring, data analysis, reporting.',
        description:
            'Part of the Online Marketing team, responsible for client scoring, data analysis and reporting.',
        achievements: [
            'Customer scoring model + segmentation targeting a 10% reduction in marketing comms costs.',
            'Exploratory data analysis & visualization identifying a new target market segment.',
            'Customer & sales performance dashboards from a SQL Server database.',
            'Ad-hoc analysis and reporting to support marketing strategies and decision-making.',
        ],
        stack: [
            { label: 'SQL Server', c: 'engineering' },
            { label: 'Segmentation', c: 'ml' },
            { label: 'Scoring', c: 'ml' },
            { label: 'EDA', c: 'analytics' },
            { label: 'Dashboards', c: 'analytics' },
        ],
    },
];

// Format "1y 8mo"
window.CV_DURATION = function (start, end) {
    const parse = (s) => {
        if (!s) return new Date();
        const [y, m] = s.split('-').map(Number);
        return new Date(y, (m || 1) - 1, 1);
    };
    const a = parse(start);
    const b = end ? parse(end) : new Date();
    let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (months < 1) months = 1;
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m}mo`;
    if (m === 0) return `${y}y`;
    return `${y}y ${m}mo`;
};

// Skill-matrix rows (category → years) used in V3 density map.
window.CV_SKILL_MATRIX = {
    years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
    groups: [
        {
            label: 'Languages',
            rows: [
                { label: 'Python',              values: [3, 3, 4, 4, 4, 4, 4] },
                { label: 'SQL',                 values: [2, 3, 4, 4, 4, 4, 4] },
                { label: 'Shell / Bash',        values: [1, 2, 2, 3, 3, 3, 3] },
            ],
        },
        {
            label: 'Data & Big Data',
            rows: [
                { label: 'pandas / NumPy',      values: [3, 3, 4, 4, 4, 4, 4] },
                { label: 'PySpark',             values: [0, 0, 1, 2, 4, 4, 4] },
                { label: 'Databricks',          values: [0, 0, 0, 0, 3, 4, 4] },
                { label: 'BigQuery',            values: [0, 1, 2, 4, 2, 2, 2] },
                { label: 'Airflow',             values: [0, 0, 2, 4, 3, 3, 3] },
                { label: 'dbt',                 values: [0, 0, 0, 2, 2, 3, 3] },
            ],
        },
        {
            label: 'ML / AI',
            rows: [
                { label: 'Scikit-learn',        values: [2, 3, 4, 3, 2, 2, 2] },
                { label: 'Classification',      values: [2, 3, 4, 3, 2, 2, 2] },
                { label: 'Segmentation',        values: [3, 3, 3, 2, 1, 1, 1] },
                { label: 'Transformers',        values: [0, 0, 2, 3, 2, 2, 2] },
                { label: 'LLM / RAG',           values: [0, 0, 0, 3, 2, 3, 3] },
                { label: 'NLP',                 values: [0, 1, 2, 4, 2, 2, 2] },
            ],
        },
        {
            label: 'Cloud & DevOps',
            rows: [
                { label: 'GCP',                 values: [0, 1, 2, 4, 1, 1, 1] },
                { label: 'AWS',                 values: [0, 1, 2, 2, 2, 2, 2] },
                { label: 'Azure',               values: [0, 0, 0, 0, 3, 4, 4] },
                { label: 'Docker',              values: [1, 2, 2, 3, 3, 3, 3] },
                { label: 'CI/CD',               values: [0, 1, 2, 3, 3, 3, 3] },
            ],
        },
        {
            label: 'Analytics & Viz',
            rows: [
                { label: 'EDA',                 values: [3, 3, 4, 3, 2, 2, 2] },
                { label: 'Dashboards',          values: [3, 3, 3, 2, 2, 2, 2] },
                { label: 'Streamlit',           values: [0, 1, 2, 4, 1, 1, 1] },
            ],
        },
    ],
};
