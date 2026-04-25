// i18n.js — lightweight language switcher + translations
// Supported UI languages: EN (English), ES (Spanish), FR (French), DA (Danish)
// Hero typewriter cycles through 10 greetings regardless of UI language.

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────
    // Translations
    // Keys are dotted; values are per-locale strings.
    // ─────────────────────────────────────────────────────────────
    const TRANSLATIONS = {
        en: {
            // Nav
            'nav.tagline': 'Data Engineer // Copenhagen',
            'nav.about': 'About',
            'nav.projects': 'Projects',
            'nav.blog': 'Blog',
            'nav.resume': 'Resume',
            'nav.theme_title': 'Switch Theme',
            'nav.lang_title': 'Switch language',
            'nav.menu_aria': 'Toggle navigation',

            // Doc titles
            'title.home': 'Maxime Haegeman | Data Engineer',
            'title.projects': 'Maxime | Projects',
            'title.blog': 'Maxime | Blog',
            'title.resume': 'Maxime | Resume',

            // Home / hero
            'hero.label': 'Maxime Haegeman // Data Engineer // Copenhagen',
            'hero.subtitle_line1': 'SENIOR DATA & ML ENGINEER //',
            'hero.subtitle_line2': 'SCALABLE PIPELINES //',
            'hero.subtitle_line3': 'AI PRODUCT DEVELOPMENT',

            // Skills
            'skills.label': 'Status: Active // Skills',
            'skills.langs': 'Programming Languages',
            'skills.cloud': 'Cloud & Infra',
            'skills.data': 'Data Engineering',
            'skills.ml': 'ML Stack',
            'skills.mon': 'Monitoring',
            'skills.pm': 'Project Management',

            // Home projects
            'home.projects.label': 'Repository Feed // Featured',
            'home.projects.explore': 'explore_all',
            'home.projects.seo_desc': 'Automated content generation tool optimized for SEO performance.',
            'home.projects.openweather_desc': 'Integration with OpenWeather API for real-time meteorological data analysis.',
            'home.projects.scoring_desc': 'Credit scoring model and analysis for banking customer data.',

            // Contact
            'contact.label': 'Status: Online // Contact',
            'contact.prompt': '// Interested in collaboration? Execute the command below.',

            // maxime.py code box (string literals + comment only; keywords stay as code)
            'code.doc_line1': 'Developer bridging the gap between',
            'code.doc_line2': 'models and production, architecting',
            'code.doc_line3': 'scalable data & ML pipelines.',
            'code.role': '"Senior Data / ML Engineer"',
            'code.base': '"Copenhagen, Denmark"',
            'code.comment': '# years of experience',
            'code.mission': '"From messy data to reliable predictions, at scale."',

            // Footer / status
            'status.online': 'System Status: Online',
            'status.copenhagen': 'Copenhagen',
            'footer.copy': '© 2025 Maxime Haegeman. Built with code.',

            // Projects page
            'projects.label': 'Repository Feed // GitHub API',
            'projects.title_line1': 'OPEN SOURCE',
            'projects.title_line2': '/ PROJECTS',
            'projects.subtitle': 'A collection of data engineering, ML, and analytics projects — sorted by stars.',
            'projects.briefing_label': 'System Briefing',
            'projects.briefing_text': 'Repositories fetched live from GitHub API, sorted by community interest.',
            'projects.source': 'Source',
            'projects.status': 'Status',
            'projects.status_online': 'Online',
            'projects.loading': '_fetching_data_from_github...',
            'projects.git_cmd': '> git fetch origin master --sort=stars',
            'projects.live_link': 'Live ↗',
            'projects.source_link': 'GitHub ↗',

            // Blog page
            'blog.label': 'Publication Feed // Medium RSS',
            'blog.title_line1': 'ARTICLES',
            'blog.title_line2': '& ANALYSES',
            'blog.subtitle': 'Writing on data engineering, machine learning, and the systems that power modern AI products.',
            'blog.briefing_label': 'System Briefing',
            'blog.briefing_text': 'Articles on scalable data pipelines, ML engineering, and production AI systems.',
            'blog.channel': 'Channel',
            'blog.status': 'Status',
            'blog.status_online': 'Online',
            'blog.loading': '_establishing_connection_to_rss_feed...',

            // CV page
            'cv.label': 'System Profile // Work History',
            'cv.title_line1': 'CAREER /',
            'cv.title_line2': 'EXPERIENCE',
            'cv.subtitle': '5 years building data and ML systems at scale — from pipelines to production models.',
            'cv.briefing_label': 'System Briefing',
            'cv.briefing_text': 'Work history loaded from experience.json — roles, achievements, and tech stacks.',
            'cv.experience': 'Experience',
            'cv.years': '5 yrs',
            'cv.base': 'Base',
            'cv.loading': '_fetching_experience_data...',
            'cv.download': '[ DOWNLOAD_RESUME_PDF ]',
        },

        es: {
            'nav.tagline': 'Ingeniero de Datos // Copenhague',
            'nav.about': 'Sobre mí',
            'nav.projects': 'Proyectos',
            'nav.blog': 'Blog',
            'nav.resume': 'Currículum',
            'nav.theme_title': 'Cambiar tema',
            'nav.lang_title': 'Cambiar idioma',
            'nav.menu_aria': 'Alternar navegación',

            'title.home': 'Maxime Haegeman | Ingeniero de Datos',
            'title.projects': 'Maxime | Proyectos',
            'title.blog': 'Maxime | Blog',
            'title.resume': 'Maxime | Currículum',

            'hero.label': 'Maxime Haegeman // Ingeniero de Datos // Copenhague',
            'hero.subtitle_line1': 'INGENIERO SENIOR DE DATOS Y ML //',
            'hero.subtitle_line2': 'PIPELINES ESCALABLES //',
            'hero.subtitle_line3': 'DESARROLLO DE PRODUCTOS DE IA',

            'skills.label': 'Estado: Activo // Habilidades',
            'skills.langs': 'Lenguajes de Programación',
            'skills.cloud': 'Cloud e Infraestructura',
            'skills.data': 'Ingeniería de Datos',
            'skills.ml': 'Stack de ML',
            'skills.mon': 'Monitorización',
            'skills.pm': 'Gestión de Proyectos',

            'home.projects.label': 'Feed de Repositorios // Destacados',
            'home.projects.explore': 'explorar_todo',
            'home.projects.seo_desc': 'Herramienta automatizada de generación de contenido optimizada para SEO.',
            'home.projects.openweather_desc': 'Integración con la API OpenWeather para análisis meteorológico en tiempo real.',
            'home.projects.scoring_desc': 'Modelo de scoring crediticio y análisis para datos de clientes bancarios.',

            'contact.label': 'Estado: En línea // Contacto',
            'contact.prompt': '// ¿Interesado en colaborar? Ejecuta el comando de abajo.',

            'code.doc_line1': 'Desarrollador que tiende puentes entre',
            'code.doc_line2': 'modelos y producción, diseñando',
            'code.doc_line3': 'pipelines de datos y ML escalables.',
            'code.role': '"Ingeniero Senior de Datos / ML"',
            'code.base': '"Copenhague, Dinamarca"',
            'code.comment': '# años de experiencia',
            'code.mission': '"De datos caóticos a predicciones fiables, a escala."',

            'status.online': 'Estado del sistema: En línea',
            'status.copenhagen': 'Copenhague',
            'footer.copy': '© 2025 Maxime Haegeman. Hecho con código.',

            'projects.label': 'Feed de Repositorios // GitHub API',
            'projects.title_line1': 'OPEN SOURCE',
            'projects.title_line2': '/ PROYECTOS',
            'projects.subtitle': 'Una colección de proyectos de ingeniería de datos, ML y analítica — ordenados por estrellas.',
            'projects.briefing_label': 'Informe del sistema',
            'projects.briefing_text': 'Repositorios obtenidos en vivo desde la API de GitHub, ordenados por interés de la comunidad.',
            'projects.source': 'Fuente',
            'projects.status': 'Estado',
            'projects.status_online': 'En línea',
            'projects.loading': '_obteniendo_datos_de_github...',
            'projects.git_cmd': '> git fetch origin master --sort=stars',
            'projects.live_link': 'En vivo ↗',
            'projects.source_link': 'GitHub ↗',

            'blog.label': 'Feed de Publicaciones // Medium RSS',
            'blog.title_line1': 'ARTÍCULOS',
            'blog.title_line2': 'Y ANÁLISIS',
            'blog.subtitle': 'Escribo sobre ingeniería de datos, aprendizaje automático y los sistemas que impulsan los productos de IA modernos.',
            'blog.briefing_label': 'Informe del sistema',
            'blog.briefing_text': 'Artículos sobre pipelines de datos escalables, ingeniería de ML y sistemas de IA en producción.',
            'blog.channel': 'Canal',
            'blog.status': 'Estado',
            'blog.status_online': 'En línea',
            'blog.loading': '_estableciendo_conexión_con_rss...',

            'cv.label': 'Perfil del Sistema // Historial Laboral',
            'cv.title_line1': 'TRAYECTORIA /',
            'cv.title_line2': 'EXPERIENCIA',
            'cv.subtitle': '5 años construyendo sistemas de datos y ML a escala — desde pipelines hasta modelos en producción.',
            'cv.briefing_label': 'Informe del sistema',
            'cv.briefing_text': 'Historial cargado desde experience.json — roles, logros y stacks tecnológicos.',
            'cv.experience': 'Experiencia',
            'cv.years': '5 años',
            'cv.base': 'Base',
            'cv.loading': '_obteniendo_datos_de_experiencia...',
            'cv.download': '[ DESCARGAR_CV_PDF ]',
        },

        fr: {
            'nav.tagline': 'Ingénieur Data // Copenhague',
            'nav.about': 'À propos',
            'nav.projects': 'Projets',
            'nav.blog': 'Blog',
            'nav.resume': 'CV',
            'nav.theme_title': 'Changer de thème',
            'nav.lang_title': 'Changer de langue',
            'nav.menu_aria': 'Basculer la navigation',

            'title.home': 'Maxime Haegeman | Ingénieur Data',
            'title.projects': 'Maxime | Projets',
            'title.blog': 'Maxime | Blog',
            'title.resume': 'Maxime | CV',

            'hero.label': 'Maxime Haegeman // Ingénieur Data // Copenhague',
            'hero.subtitle_line1': 'INGÉNIEUR SENIOR DATA & ML //',
            'hero.subtitle_line2': 'PIPELINES SCALABLES //',
            'hero.subtitle_line3': 'DÉVELOPPEMENT DE PRODUITS IA',

            'skills.label': 'Statut : Actif // Compétences',
            'skills.langs': 'Langages de programmation',
            'skills.cloud': 'Cloud & Infra',
            'skills.data': 'Data Engineering',
            'skills.ml': 'Stack ML',
            'skills.mon': 'Monitoring',
            'skills.pm': 'Gestion de projet',

            'home.projects.label': 'Flux de dépôts // Sélection',
            'home.projects.explore': 'tout_explorer',
            'home.projects.seo_desc': 'Outil de génération de contenu automatisé optimisé pour la performance SEO.',
            'home.projects.openweather_desc': 'Intégration avec l\u2019API OpenWeather pour l\u2019analyse de données météorologiques en temps réel.',
            'home.projects.scoring_desc': 'Modèle de scoring crédit et analyse de données clients bancaires.',

            'contact.label': 'Statut : En ligne // Contact',
            'contact.prompt': '// Intéressé par une collaboration ? Exécutez la commande ci-dessous.',

            'code.doc_line1': 'Développeur faisant le lien entre',
            'code.doc_line2': 'modèles et production, architecturant',
            'code.doc_line3': 'des pipelines data & ML scalables.',
            'code.role': '"Ingénieur Senior Data / ML"',
            'code.base': '"Copenhague, Danemark"',
            'code.comment': '# années d\u2019expérience',
            'code.mission': '"Des données désordonnées aux prédictions fiables, à grande échelle."',

            'status.online': 'État du système : En ligne',
            'status.copenhagen': 'Copenhague',
            'footer.copy': '© 2025 Maxime Haegeman. Conçu avec du code.',

            'projects.label': 'Flux de dépôts // API GitHub',
            'projects.title_line1': 'OPEN SOURCE',
            'projects.title_line2': '/ PROJETS',
            'projects.subtitle': 'Une collection de projets data engineering, ML et analytics — triés par étoiles.',
            'projects.briefing_label': 'Briefing système',
            'projects.briefing_text': 'Dépôts récupérés en direct via l\u2019API GitHub, triés selon l\u2019intérêt de la communauté.',
            'projects.source': 'Source',
            'projects.status': 'Statut',
            'projects.status_online': 'En ligne',
            'projects.loading': '_récupération_des_données_github...',
            'projects.git_cmd': '> git fetch origin master --sort=stars',
            'projects.live_link': 'En direct ↗',
            'projects.source_link': 'GitHub ↗',

            'blog.label': 'Flux de publications // Medium RSS',
            'blog.title_line1': 'ARTICLES',
            'blog.title_line2': '& ANALYSES',
            'blog.subtitle': 'J\u2019écris sur le data engineering, le machine learning et les systèmes qui font tourner les produits IA modernes.',
            'blog.briefing_label': 'Briefing système',
            'blog.briefing_text': 'Articles sur les pipelines de données scalables, l\u2019ingénierie ML et les systèmes IA en production.',
            'blog.channel': 'Canal',
            'blog.status': 'Statut',
            'blog.status_online': 'En ligne',
            'blog.loading': '_connexion_au_flux_rss...',

            'cv.label': 'Profil système // Parcours professionnel',
            'cv.title_line1': 'CARRIÈRE /',
            'cv.title_line2': 'EXPÉRIENCE',
            'cv.subtitle': '5 ans à construire des systèmes data et ML à grande échelle — des pipelines aux modèles en production.',
            'cv.briefing_label': 'Briefing système',
            'cv.briefing_text': 'Historique chargé depuis experience.json — rôles, réalisations et stacks techniques.',
            'cv.experience': 'Expérience',
            'cv.years': '5 ans',
            'cv.base': 'Base',
            'cv.loading': '_récupération_des_données_d_expérience...',
            'cv.download': '[ TÉLÉCHARGER_CV_PDF ]',
        },

        da: {
            'nav.tagline': 'Data Engineer // København',
            'nav.about': 'Om mig',
            'nav.projects': 'Projekter',
            'nav.blog': 'Blog',
            'nav.resume': 'CV',
            'nav.theme_title': 'Skift tema',
            'nav.lang_title': 'Skift sprog',
            'nav.menu_aria': 'Skift navigation',

            'title.home': 'Maxime Haegeman | Data Engineer',
            'title.projects': 'Maxime | Projekter',
            'title.blog': 'Maxime | Blog',
            'title.resume': 'Maxime | CV',

            'hero.label': 'Maxime Haegeman // Data Engineer // København',
            'hero.subtitle_line1': 'SENIOR DATA- OG ML-ENGINEER //',
            'hero.subtitle_line2': 'SKALERBARE PIPELINES //',
            'hero.subtitle_line3': 'UDVIKLING AF AI-PRODUKTER',

            'skills.label': 'Status: Aktiv // Kompetencer',
            'skills.langs': 'Programmeringssprog',
            'skills.cloud': 'Cloud & Infrastruktur',
            'skills.data': 'Data Engineering',
            'skills.ml': 'ML-stak',
            'skills.mon': 'Overvågning',
            'skills.pm': 'Projektledelse',

            'home.projects.label': 'Repository-feed // Udvalgte',
            'home.projects.explore': 'udforsk_alt',
            'home.projects.seo_desc': 'Automatiseret værktøj til indholdsgenerering optimeret til SEO.',
            'home.projects.openweather_desc': 'Integration med OpenWeather API til realtidsanalyse af vejrdata.',
            'home.projects.scoring_desc': 'Kreditscoringmodel og analyse af bankkundedata.',

            'contact.label': 'Status: Online // Kontakt',
            'contact.prompt': '// Interesseret i samarbejde? Kør kommandoen nedenfor.',

            'code.doc_line1': 'Udvikler der bygger bro mellem',
            'code.doc_line2': 'modeller og produktion, og arkitekt for',
            'code.doc_line3': 'skalerbare data- og ML-pipelines.',
            'code.role': '"Senior Data- / ML-Engineer"',
            'code.base': '"København, Danmark"',
            'code.comment': '# års erfaring',
            'code.mission': '"Fra rodede data til pålidelige forudsigelser, i stor skala."',

            'status.online': 'Systemstatus: Online',
            'status.copenhagen': 'København',
            'footer.copy': '© 2025 Maxime Haegeman. Bygget med kode.',

            'projects.label': 'Repository-feed // GitHub API',
            'projects.title_line1': 'OPEN SOURCE',
            'projects.title_line2': '/ PROJEKTER',
            'projects.subtitle': 'En samling af data engineering-, ML- og analyseprojekter — sorteret efter stjerner.',
            'projects.briefing_label': 'System-briefing',
            'projects.briefing_text': 'Repositories hentet live via GitHub API, sorteret efter fællesskabets interesse.',
            'projects.source': 'Kilde',
            'projects.status': 'Status',
            'projects.status_online': 'Online',
            'projects.loading': '_henter_data_fra_github...',
            'projects.git_cmd': '> git fetch origin master --sort=stars',
            'projects.live_link': 'Live ↗',
            'projects.source_link': 'GitHub ↗',

            'blog.label': 'Publikationsfeed // Medium RSS',
            'blog.title_line1': 'ARTIKLER',
            'blog.title_line2': '& ANALYSER',
            'blog.subtitle': 'Skriverier om data engineering, machine learning og systemerne bag moderne AI-produkter.',
            'blog.briefing_label': 'System-briefing',
            'blog.briefing_text': 'Artikler om skalerbare data-pipelines, ML-engineering og AI-systemer i produktion.',
            'blog.channel': 'Kanal',
            'blog.status': 'Status',
            'blog.status_online': 'Online',
            'blog.loading': '_opretter_forbindelse_til_rss...',

            'cv.label': 'Systemprofil // Arbejdshistorik',
            'cv.title_line1': 'KARRIERE /',
            'cv.title_line2': 'ERFARING',
            'cv.subtitle': '5 år med at bygge data- og ML-systemer i stor skala — fra pipelines til produktionsmodeller.',
            'cv.briefing_label': 'System-briefing',
            'cv.briefing_text': 'Arbejdshistorik indlæst fra experience.json — roller, resultater og teknologistakke.',
            'cv.experience': 'Erfaring',
            'cv.years': '5 år',
            'cv.base': 'Base',
            'cv.loading': '_henter_erfaringsdata...',
            'cv.download': '[ HENT_CV_PDF ]',
        },
    };

    // ─────────────────────────────────────────────────────────────
    // Dynamic content translations (projects + experience)
    // Keyed by a stable ID (repo name / job index).
    // ─────────────────────────────────────────────────────────────
    const PROJECTS = {
        'Python-Object-Clasifier': {
            en: {
                title: 'Topic Modeling Classifier',
                desc: 'Latent Dirichlet Allocation pipeline that discovers topics from raw text and routes documents to the right bucket. Classic NLP foundation work.',
            },
            es: {
                title: 'Clasificador por Modelado de Temas',
                desc: 'Pipeline de Latent Dirichlet Allocation que descubre temas en texto bruto y enruta los documentos al grupo correcto. Trabajo clásico de NLP.',
            },
            fr: {
                title: 'Classifieur par Topic Modeling',
                desc: 'Pipeline Latent Dirichlet Allocation qui découvre les sujets d\u2019un texte brut et route les documents vers la bonne catégorie. Du NLP classique et solide.',
            },
            da: {
                title: 'Emnemodellerings-klassifikator',
                desc: 'Latent Dirichlet Allocation-pipeline, der finder emner i rå tekst og sender dokumenter til den rette kategori. Klassisk NLP-fundament.',
            },
        },
        'nextrank': {
            en: {
                title: 'SEO Content Generator',
                desc: 'Automated content generation tool optimized for SEO performance. LLM-powered pipeline that researches keywords, drafts copy, and scores readability against competitor SERPs.',
            },
            es: {
                title: 'Generador de Contenido SEO',
                desc: 'Herramienta automatizada de generación de contenido optimizada para SEO. Pipeline con LLM que investiga palabras clave, redacta textos y evalúa la legibilidad frente a los SERPs de la competencia.',
            },
            fr: {
                title: 'Générateur de contenu SEO',
                desc: 'Outil de génération de contenu automatisé optimisé pour le SEO. Pipeline basé sur un LLM qui analyse les mots-clés, rédige les textes et évalue la lisibilité face aux SERP concurrents.',
            },
            da: {
                title: 'SEO-indholdsgenerator',
                desc: 'Automatiseret værktøj til indholdsgenerering optimeret til SEO. LLM-drevet pipeline, der undersøger nøgleord, skriver tekster og vurderer læsbarhed mod konkurrenters SERP\u2019er.',
            },
        },
        'scoring-bank-project': {
            en: {
                title: 'Bank Credit Scoring',
                desc: 'End-to-end credit risk model with imbalanced learning. LightGBM + SHAP explainability, served through a Streamlit dashboard where loan officers can interrogate any prediction.',
            },
            es: {
                title: 'Scoring de Crédito Bancario',
                desc: 'Modelo de riesgo crediticio end-to-end con aprendizaje desbalanceado. LightGBM + explicabilidad SHAP, servido a través de un dashboard Streamlit donde los analistas pueden interrogar cualquier predicción.',
            },
            fr: {
                title: 'Scoring de crédit bancaire',
                desc: 'Modèle de risque de crédit de bout en bout avec apprentissage déséquilibré. LightGBM + explicabilité SHAP, servi via un tableau de bord Streamlit où les chargés de crédit peuvent interroger chaque prédiction.',
            },
            da: {
                title: 'Bankkreditscoring',
                desc: 'End-to-end kreditrisiko-model med ubalanceret læring. LightGBM + SHAP-forklaring, serveret via et Streamlit-dashboard, hvor kreditrådgivere kan udforske enhver forudsigelse.',
            },
        },
        'openweather': {
            en: {
                title: 'OpenWeather Integration',
                desc: 'Lightweight Python client for the OpenWeather API. Fetches and normalizes real-time meteorological data for downstream pipelines.',
            },
            es: {
                title: 'Integración con OpenWeather',
                desc: 'Cliente Python ligero para la API de OpenWeather. Obtiene y normaliza datos meteorológicos en tiempo real para pipelines posteriores.',
            },
            fr: {
                title: 'Intégration OpenWeather',
                desc: 'Client Python léger pour l\u2019API OpenWeather. Récupère et normalise les données météorologiques en temps réel pour les pipelines en aval.',
            },
            da: {
                title: 'OpenWeather-integration',
                desc: 'Letvægts-Python-klient til OpenWeather API\u2019et. Henter og normaliserer realtids-vejrdata til efterfølgende pipelines.',
            },
        },
        'fruit-classifier-aws': {
            en: {
                title: 'Distributed Fruit Classifier',
                desc: 'Image classification at scale on AWS EMR. PySpark broadcasts a TensorFlow model across executors to process 50k+ images in parallel — distributed deep learning on cloud infra.',
            },
            es: {
                title: 'Clasificador de Frutas Distribuido',
                desc: 'Clasificación de imágenes a escala en AWS EMR. PySpark difunde un modelo de TensorFlow entre los ejecutores para procesar más de 50k imágenes en paralelo — deep learning distribuido en la nube.',
            },
            fr: {
                title: 'Classifieur de fruits distribué',
                desc: 'Classification d\u2019images à grande échelle sur AWS EMR. PySpark diffuse un modèle TensorFlow sur les exécuteurs pour traiter plus de 50k images en parallèle \u2014 deep learning distribué sur infra cloud.',
            },
            da: {
                title: 'Distribueret Frugt-klassifikator',
                desc: 'Billedklassifikation i stor skala på AWS EMR. PySpark broadcaster en TensorFlow-model på tværs af executors for at behandle 50k+ billeder parallelt \u2014 distribueret deep learning i skyen.',
            },
        },
        'nutriscore-predictor': {
            en: {
                title: 'Nutriscore Prediction',
                desc: 'Linear regression to predict the Nutri-Score of food products from nutritional facts. Showcases predictive modeling on a public OpenFoodFacts dataset.',
            },
            es: {
                title: 'Predicción del Nutriscore',
                desc: 'Regresión lineal para predecir el Nutri-Score de productos alimentarios a partir de su información nutricional. Modelado predictivo sobre el dataset público OpenFoodFacts.',
            },
            fr: {
                title: 'Prédiction du Nutri-Score',
                desc: 'Régression linéaire pour prédire le Nutri-Score d\u2019un produit alimentaire à partir de ses valeurs nutritionnelles. Modélisation prédictive sur le jeu de données public OpenFoodFacts.',
            },
            da: {
                title: 'Nutri-Score-forudsigelse',
                desc: 'Lineær regression til at forudsige Nutri-Score for fødevareprodukter ud fra næringsindhold. Prædiktiv modellering på det offentlige OpenFoodFacts-datasæt.',
            },
        },
        'python-client-segmentation': {
            en: {
                title: 'Customer Segmentation',
                desc: 'K-Means clustering on customer behavior data to surface actionable marketing personas. Pandas-driven feature engineering and silhouette-based cluster validation.',
            },
            es: {
                title: 'Segmentación de Clientes',
                desc: 'Clustering K-Means sobre datos de comportamiento de clientes para revelar personas accionables de marketing. Feature engineering con Pandas y validación de clusters por silhouette.',
            },
            fr: {
                title: 'Segmentation clients',
                desc: 'Clustering K-Means sur des données comportementales pour dégager des personas marketing actionnables. Feature engineering avec Pandas et validation des clusters par silhouette.',
            },
            da: {
                title: 'Kundesegmentering',
                desc: 'K-Means-klyngning på kundeadfærdsdata for at afdække handlingsorienterede marketing-personas. Pandas-baseret feature engineering og silhouette-baseret klyngevalidering.',
            },
        },
        'seattle-building-energy-forecast': {
            en: {
                title: 'Energy Consumption Prediction',
                desc: 'Regression models forecasting building energy use from weather and occupancy features. Scikit-learn pipelines with full EDA and visualization of feature importance.',
            },
            es: {
                title: 'Predicción de Consumo Energético',
                desc: 'Modelos de regresión que predicen el consumo energético de edificios a partir de variables meteorológicas y de ocupación. Pipelines de Scikit-learn con EDA completo y visualización de importancia de variables.',
            },
            fr: {
                title: 'Prédiction de consommation énergétique',
                desc: 'Modèles de régression prédisant la consommation énergétique des bâtiments à partir de variables météo et d\u2019occupation. Pipelines Scikit-learn avec EDA complet et visualisation de l\u2019importance des variables.',
            },
            da: {
                title: 'Forudsigelse af energiforbrug',
                desc: 'Regressionsmodeller, der forudsiger bygningers energiforbrug ud fra vejr- og belægningsvariabler. Scikit-learn-pipelines med fuld EDA og visualisering af feature-betydning.',
            },
        },
        'Verba': {
            en: {
                title: 'Verba RAG Chatbot',
                desc: 'Open-source retrieval-augmented chatbot with Weaviate vector store. Indexes any document corpus and answers questions with citations — pluggable LLM backends.',
            },
            es: {
                title: 'Chatbot RAG Verba',
                desc: 'Chatbot de recuperación aumentada de código abierto con vector store Weaviate. Indexa cualquier corpus documental y responde con citas — backends LLM intercambiables.',
            },
            fr: {
                title: 'Chatbot RAG Verba',
                desc: 'Chatbot open source à récupération augmentée avec vector store Weaviate. Indexe n\u2019importe quel corpus et répond avec citations \u2014 backends LLM interchangeables.',
            },
            da: {
                title: 'Verba RAG-chatbot',
                desc: 'Open source RAG-chatbot med Weaviate-vektorlager. Indekserer ethvert dokumentkorpus og svarer med kildehenvisninger \u2014 udskiftelige LLM-backends.',
            },
        },
        'sgtm-cloud-run-shell': {
            en: {
                title: 'Server-side GTM on Cloud Run',
                desc: 'Shell scaffolding to deploy a server-side Google Tag Manager container on GCP Cloud Run. DevOps recipe for privacy-friendly tracking infra.',
            },
            es: {
                title: 'GTM server-side en Cloud Run',
                desc: 'Scaffolding en Shell para desplegar un contenedor de Google Tag Manager server-side en GCP Cloud Run. Receta DevOps para una infraestructura de tracking respetuosa con la privacidad.',
            },
            fr: {
                title: 'GTM côté serveur sur Cloud Run',
                desc: 'Scaffolding Shell pour déployer un conteneur Google Tag Manager côté serveur sur GCP Cloud Run. Recette DevOps pour une infra de tracking respectueuse de la vie privée.',
            },
            da: {
                title: 'Server-side GTM på Cloud Run',
                desc: 'Shell-scaffolding til at deploye en server-side Google Tag Manager-container på GCP Cloud Run. DevOps-opskrift på privacy-venlig tracking-infrastruktur.',
            },
        },
        'docker-stacks-pyspark': {
            en: {
                title: 'Docker PySpark Stacks',
                desc: 'Reproducible Docker images bundling Jupyter + PySpark for local distributed-data prototyping. Works as a base for ML notebooks needing Spark.',
            },
            es: {
                title: 'Stacks Docker de PySpark',
                desc: 'Imágenes Docker reproducibles con Jupyter + PySpark para prototipar datos distribuidos en local. Sirve como base para notebooks de ML que necesitan Spark.',
            },
            fr: {
                title: 'Stacks Docker PySpark',
                desc: 'Images Docker reproductibles embarquant Jupyter + PySpark pour prototyper en local des traitements distribués. Base idéale pour des notebooks ML nécessitant Spark.',
            },
            da: {
                title: 'Docker PySpark-stakke',
                desc: 'Reproducerbare Docker-images med Jupyter + PySpark til lokal distribueret data-prototypning. Fungerer som base for ML-notebooks, der kræver Spark.',
            },
        },
    };

    // Experience entries, keyed by company short id — order matters: most recent first.
    const EXPERIENCE_ORDER = ['massive', 'mvh', 'bnzsa', 'becquet'];
    const EXPERIENCE = {
        massive: {
            common: {
                company: 'Massive Entertainment',
                companyDisplay: 'Massive Entertainment',
                companyUrl: 'https://www.massive.se/',
                logo: 'content/company-logos/massive-entertainment.svg',
                start: '2024-01',
                end: null,
                stack: [
                    { label: 'PySpark',      c: 'engineering' },
                    { label: 'Databricks',   c: 'cloud' },
                    { label: 'SQL',          c: 'engineering' },
                    { label: 'ML Pipelines', c: 'ml' },
                    { label: 'Azure',        c: 'cloud' },
                ],
            },
            en: {
                period: '2024 - Present',
                role: 'Data Engineer',
                companyNote: 'A Ubisoft Studio',
                description: 'Leading the data engineering efforts for live game analytics and ML pipelines.',
                achievements: [
                    'Data ingestion and preprocessing for ML projects.',
                    'Provide tools and templates for the developers in the Game Intelligence department.',
                    'Applying big data optimisation practices (PySpark / SQL).',
                    'Lead a storage and compute data migration from legacy tool to Databricks.',
                ],
            },
            es: {
                period: '2024 - Actualidad',
                role: 'Data Engineer',
                companyNote: 'Un estudio de Ubisoft',
                description: 'Lidero los esfuerzos de ingeniería de datos para analítica de juegos en vivo y pipelines de ML.',
                achievements: [
                    'Ingesta y preprocesamiento de datos para proyectos de ML.',
                    'Suministro de herramientas y plantillas para los desarrolladores del departamento Game Intelligence.',
                    'Aplicación de prácticas de optimización de big data (PySpark / SQL).',
                    'Lidero una migración de almacenamiento y cómputo desde una herramienta heredada hacia Databricks.',
                ],
            },
            fr: {
                period: '2024 - Aujourd\u2019hui',
                role: 'Data Engineer',
                companyNote: 'Un studio Ubisoft',
                description: 'Je pilote l\u2019ingénierie de données pour les analytics live des jeux et les pipelines ML.',
                achievements: [
                    'Ingestion et prétraitement des données pour les projets ML.',
                    'Mise à disposition d\u2019outils et de templates pour les développeurs du département Game Intelligence.',
                    'Application de pratiques d\u2019optimisation big data (PySpark / SQL).',
                    'Pilotage d\u2019une migration de stockage et de calcul d\u2019un outil legacy vers Databricks.',
                ],
            },
            da: {
                period: '2024 - Nu',
                role: 'Data Engineer',
                companyNote: 'Et Ubisoft-studie',
                description: 'Leder data engineering-indsatsen for live game-analytics og ML-pipelines.',
                achievements: [
                    'Dataindtagelse og forbehandling til ML-projekter.',
                    'Leverer værktøjer og skabeloner til udviklerne i Game Intelligence-afdelingen.',
                    'Anvender big data-optimeringspraksisser (PySpark / SQL).',
                    'Leder en storage- og compute-migrering fra et legacy-værktøj til Databricks.',
                ],
            },
        },
        mvh: {
            common: {
                company: 'MvH Media',
                companyDisplay: 'MvH Media',
                companyUrl: 'https://folloagency.com/',
                logo: 'content/company-logos/follo.svg',
                start: '2023-03',
                end: '2024-01',
                stack: [
                    { label: 'Airflow',   c: 'engineering' },
                    { label: 'BigQuery',  c: 'cloud' },
                    { label: 'GCP',       c: 'cloud' },
                    { label: 'NLP',       c: 'nlp' },
                    { label: 'Streamlit', c: 'analytics' },
                    { label: 'LLM',       c: 'nlp' },
                ],
            },
            en: {
                period: '2023 - 2024',
                role: 'Data Scientist / ML Engineer',
                companyNote: 'now Follo',
                description: 'Active Python developer in the data team, building data products for clients in online marketing.',
                achievements: [
                    'Built ETL pipelines for data collection and preprocessing using Airflow and Pandas.',
                    'Created data warehouses using BigQuery and Google Cloud Storage (GCS), enabling efficient storage and retrieval of large-scale marketing data.',
                    'API integration for data collection from various marketing platforms (Google Ads, Facebook Ads, etc.).',
                    'Developed sentiment analysis models to analyze customer feedback using NLP techniques.',
                    'Implemented a Category and Product description text generator app on Streamlit with a fine-tuned LLM.',
                ],
            },
            es: {
                period: '2023 - 2024',
                role: 'Data Scientist / ML Engineer',
                companyNote: 'hoy Follo',
                description: 'Desarrollador Python activo en el equipo de datos, construyendo productos de datos para clientes de marketing online.',
                achievements: [
                    'Construí pipelines ETL para recolección y preprocesamiento de datos usando Airflow y Pandas.',
                    'Creación de data warehouses con BigQuery y Google Cloud Storage (GCS), permitiendo el almacenamiento y recuperación eficientes de datos de marketing a gran escala.',
                    'Integración de APIs para recolectar datos de distintas plataformas de marketing (Google Ads, Facebook Ads, etc.).',
                    'Desarrollo de modelos de análisis de sentimiento para analizar feedback de clientes mediante técnicas de NLP.',
                    'Implementación de una app en Streamlit que genera descripciones de categorías y productos con un LLM ajustado.',
                ],
            },
            fr: {
                period: '2023 - 2024',
                role: 'Data Scientist / ML Engineer',
                companyNote: 'aujourd\u2019hui Follo',
                description: 'Développeur Python actif dans l\u2019équipe data, construisant des produits data pour des clients du marketing en ligne.',
                achievements: [
                    'Construction de pipelines ETL pour la collecte et le prétraitement des données avec Airflow et Pandas.',
                    'Création d\u2019entrepôts de données sur BigQuery et Google Cloud Storage (GCS), permettant un stockage et une récupération efficaces de données marketing à grande échelle.',
                    'Intégration d\u2019APIs pour collecter des données depuis plusieurs plateformes marketing (Google Ads, Facebook Ads, etc.).',
                    'Développement de modèles d\u2019analyse de sentiments pour exploiter les retours clients via du NLP.',
                    'Mise en place d\u2019une app Streamlit générant des descriptions de catégories et de produits avec un LLM fine-tuné.',
                ],
            },
            da: {
                period: '2023 - 2024',
                role: 'Data Scientist / ML Engineer',
                companyNote: 'nu Follo',
                description: 'Aktiv Python-udvikler i data-teamet, der byggede dataprodukter til kunder inden for online marketing.',
                achievements: [
                    'Byggede ETL-pipelines til dataindsamling og forbehandling med Airflow og Pandas.',
                    'Oprettede data warehouses med BigQuery og Google Cloud Storage (GCS), hvilket muliggjorde effektiv lagring og hentning af marketing-data i stor skala.',
                    'API-integration til dataindsamling fra forskellige marketingplatforme (Google Ads, Facebook Ads m.fl.).',
                    'Udviklede sentimentanalyse-modeller til at analysere kundefeedback med NLP-teknikker.',
                    'Implementerede en Streamlit-app, der genererer kategori- og produktbeskrivelser med en fine-tunet LLM.',
                ],
            },
        },
        bnzsa: {
            common: {
                company: 'BNZSA',
                companyDisplay: 'BNZSA',
                companyUrl: 'https://anteriad.com/',
                logo: 'content/company-logos/anteriad.svg',
                start: '2022-05',
                end: '2023-03',
                stack: [
                    { label: 'Python',         c: 'engineering' },
                    { label: 'SQL',            c: 'engineering' },
                    { label: 'Transformers',   c: 'nlp' },
                    { label: 'NLP',            c: 'nlp' },
                    { label: 'Speech-to-Text', c: 'nlp' },
                ],
            },
            en: {
                period: '2022 - 2023',
                role: 'Data Scientist',
                companyNote: 'now Anteriad',
                description: 'Member of the Decision Science team, focusing on building data-driven solutions for business challenges.',
                achievements: [
                    'Created a global data pipeline to collect, structure, validate, and clean data from our CRM and ERP systems using Python and SQL.',
                    'Built propensity score models to identify high-value customers for targeted marketing campaigns.',
                    'Fine-tuned a Transformer model to classify postal addresses by country — 83% accuracy across our 21 most common countries.',
                    'Developed a speech-to-text analysis tool to extract insights from customer-service calls using NLP techniques.',
                ],
            },
            es: {
                period: '2022 - 2023',
                role: 'Data Scientist',
                companyNote: 'hoy Anteriad',
                description: 'Miembro del equipo de Decision Science, centrado en construir soluciones basadas en datos para retos de negocio.',
                achievements: [
                    'Creación de un pipeline global para recolectar, estructurar, validar y limpiar datos de nuestros sistemas CRM y ERP con Python y SQL.',
                    'Construcción de modelos de propensity score para identificar clientes de alto valor en campañas de marketing segmentadas.',
                    'Fine-tuning de un modelo Transformer para clasificar direcciones postales por país — 83% de acierto en nuestros 21 países más comunes.',
                    'Desarrollo de una herramienta de speech-to-text para extraer insights de llamadas de atención al cliente mediante NLP.',
                ],
            },
            fr: {
                period: '2022 - 2023',
                role: 'Data Scientist',
                companyNote: 'aujourd\u2019hui Anteriad',
                description: 'Membre de l\u2019équipe Decision Science, focalisé sur la construction de solutions data-driven pour des enjeux métier.',
                achievements: [
                    'Création d\u2019un pipeline global pour collecter, structurer, valider et nettoyer les données de nos systèmes CRM et ERP avec Python et SQL.',
                    'Construction de modèles de propensity score pour identifier les clients à forte valeur dans les campagnes ciblées.',
                    'Fine-tuning d\u2019un modèle Transformer pour classer les adresses postales par pays \u2014 83% de précision sur nos 21 pays les plus fréquents.',
                    'Développement d\u2019un outil speech-to-text pour extraire des insights des appels du service client via du NLP.',
                ],
            },
            da: {
                period: '2022 - 2023',
                role: 'Data Scientist',
                companyNote: 'nu Anteriad',
                description: 'Medlem af Decision Science-teamet med fokus på at bygge datadrevne løsninger til forretningsudfordringer.',
                achievements: [
                    'Byggede en global datapipeline til at indsamle, strukturere, validere og rense data fra vores CRM- og ERP-systemer med Python og SQL.',
                    'Udviklede propensity score-modeller til at identificere højværdikunder til målrettede marketingkampagner.',
                    'Fine-tunede en Transformer-model til at klassificere postadresser efter land \u2014 83% nøjagtighed på vores 21 mest almindelige lande.',
                    'Udviklede et speech-to-text-værktøj til at udtrække indsigter fra kundeservice-opkald med NLP-teknikker.',
                ],
            },
        },
        becquet: {
            common: {
                company: 'Becquet',
                companyDisplay: 'Becquet',
                companyUrl: 'https://www.becquet.fr/',
                logo: 'content/company-logos/becquet.svg',
                start: '2020-09',
                end: '2022-05',
                stack: [
                    { label: 'SQL Server',   c: 'engineering' },
                    { label: 'Segmentation', c: 'ml' },
                    { label: 'Scoring',      c: 'ml' },
                    { label: 'EDA',          c: 'analytics' },
                    { label: 'Dashboards',   c: 'analytics' },
                ],
            },
            en: {
                period: '2020 - 2022',
                role: 'Junior Data Scientist',
                companyNote: null,
                description: 'Part of the Online Marketing team, responsible for client scoring, data analysis and reporting.',
                achievements: [
                    'Developed a customer scoring model and segmentation for marketing-campaign targeting, aimed at reducing communication costs by 10%.',
                    'Conducted exploratory data analysis and visualization to identify patterns in customer data, uncovering a new target market segment.',
                    'Updated customer and sales performance dashboards from an SQL Server database.',
                    'Ad-hoc analysis and reporting to support marketing strategies and decision-making.',
                ],
            },
            es: {
                period: '2020 - 2022',
                role: 'Junior Data Scientist',
                companyNote: null,
                description: 'Parte del equipo de Marketing Online, responsable de scoring de clientes, análisis de datos y reporting.',
                achievements: [
                    'Desarrollo de un modelo de scoring y segmentación de clientes para la segmentación de campañas de marketing, con el objetivo de reducir los costes de comunicación en un 10%.',
                    'Análisis exploratorio de datos y visualización para detectar patrones en los datos de clientes, descubriendo un nuevo segmento de mercado objetivo.',
                    'Actualización de dashboards de rendimiento de clientes y ventas a partir de una base de datos SQL Server.',
                    'Análisis ad-hoc y reporting de apoyo a estrategias de marketing y toma de decisiones.',
                ],
            },
            fr: {
                period: '2020 - 2022',
                role: 'Data Scientist Junior',
                companyNote: null,
                description: 'Membre de l\u2019équipe Marketing Online, en charge du scoring clients, de l\u2019analyse de données et du reporting.',
                achievements: [
                    'Développement d\u2019un modèle de scoring et de segmentation client pour le ciblage des campagnes marketing, visant à réduire de 10% les coûts de communication.',
                    'Analyses exploratoires et visualisations pour identifier des patterns dans les données clients, aboutissant à la détection d\u2019un nouveau segment cible.',
                    'Mise à jour des dashboards de performance clients et ventes à partir d\u2019une base SQL Server.',
                    'Analyses et reportings ad hoc pour soutenir les stratégies marketing et la prise de décision.',
                ],
            },
            da: {
                period: '2020 - 2022',
                role: 'Junior Data Scientist',
                companyNote: null,
                description: 'En del af Online Marketing-teamet med ansvar for kundescoring, dataanalyse og rapportering.',
                achievements: [
                    'Udviklede en kundescoring- og segmenteringsmodel til marketingkampagner med målet om at reducere kommunikationsomkostninger med 10%.',
                    'Gennemførte eksplorativ dataanalyse og visualisering for at finde mønstre i kundedata, hvilket afslørede et nyt målsegment.',
                    'Opdaterede dashboards for kunde- og salgsperformance fra en SQL Server-database.',
                    'Ad-hoc-analyser og rapportering til støtte for marketingstrategier og beslutningstagning.',
                ],
            },
        },
    };


    // Inline SVG flags (4:3 viewBox) — render identically across all OSes,
    // unlike emoji flags which Windows Chrome refuses to draw.
    const FLAG_SVG = {
        gb: '<svg class="lang-flag-svg" viewBox="0 0 60 45" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><clipPath id="fg-uk"><path d="M0 0v45h60V0z"/></clipPath><clipPath id="fg-uk-t"><path d="M30 22.5L60 0v45L30 22.5 0 45V0z"/></clipPath><g clip-path="url(#fg-uk)"><path fill="#012169" d="M0 0h60v45H0z"/><path stroke="#fff" stroke-width="9" d="M0 0l60 45m0-45L0 45"/><path stroke="#C8102E" stroke-width="6" clip-path="url(#fg-uk-t)" d="M0 0l60 45m0-45L0 45"/><path stroke="#fff" stroke-width="15" d="M30 0v45M0 22.5h60"/><path stroke="#C8102E" stroke-width="9" d="M30 0v45M0 22.5h60"/></g></svg>',
        es: '<svg class="lang-flag-svg" viewBox="0 0 60 45" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#AA151B" d="M0 0h60v45H0z"/><path fill="#F1BF00" d="M0 11.25h60v22.5H0z"/></svg>',
        fr: '<svg class="lang-flag-svg" viewBox="0 0 60 45" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#fff" d="M0 0h60v45H0z"/><path fill="#002654" d="M0 0h20v45H0z"/><path fill="#CE1126" d="M40 0h20v45H40z"/></svg>',
        dk: '<svg class="lang-flag-svg" viewBox="0 0 60 45" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#C8102E" d="M0 0h60v45H0z"/><path fill="#fff" d="M18 0h6v45h-6z"/><path fill="#fff" d="M0 19.5h60v6H0z"/></svg>',
    };

    const LANGS = [
        { code: 'en', label: 'EN', name: 'English',  flag: FLAG_SVG.gb },
        { code: 'es', label: 'ES', name: 'Español',  flag: FLAG_SVG.es },
        { code: 'fr', label: 'FR', name: 'Français', flag: FLAG_SVG.fr },
        { code: 'da', label: 'DA', name: 'Dansk',    flag: FLAG_SVG.dk },
    ];

    const DEFAULT_LANG = 'en';
    const STORAGE_KEY = 'lang';

    // ─────────────────────────────────────────────────────────────
    // Greetings used by the looping hero typewriter (not UI state).
    // Order matches the user's request.
    // ─────────────────────────────────────────────────────────────
    const GREETINGS = [
        { lang: 'en', text: 'Hi, I am Maxime !',       dir: 'ltr' },
        { lang: 'es', text: '¡Hola, soy Maxime !',     dir: 'ltr' },
        { lang: 'fr', text: 'Salut, je suis Maxime !', dir: 'ltr' },
        { lang: 'de', text: 'Hallo, ich bin Maxime !', dir: 'ltr' },
        { lang: 'it', text: 'Ciao, sono Maxime !',     dir: 'ltr' },
        { lang: 'pt', text: 'Olá, eu sou o Maxime !',  dir: 'ltr' },
        { lang: 'zh', text: '你好，我是 Maxime ！',     dir: 'ltr' },
        { lang: 'ja', text: 'こんにちは、Maximeです ！', dir: 'ltr' },
        { lang: 'da', text: 'Hej, jeg hedder Maxime !', dir: 'ltr' },
        { lang: 'ar', text: 'مرحبًا، أنا مكسيم !',     dir: 'rtl' },
    ];

    // ─────────────────────────────────────────────────────────────
    // Core helpers
    // ─────────────────────────────────────────────────────────────
    function getLang() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && TRANSLATIONS[saved]) return saved;
        return DEFAULT_LANG;
    }

    function t(key, lang) {
        lang = lang || getLang();
        const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
        if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
        // Fallback to English
        const enDict = TRANSLATIONS[DEFAULT_LANG];
        if (Object.prototype.hasOwnProperty.call(enDict, key)) return enDict[key];
        return key;
    }

    // Apply translations to any element with [data-i18n] inside `root` (default: document).
    // Supports:
    //   data-i18n="key"              → textContent
    //   data-i18n-attr="title:key;aria-label:key2"   → attributes
    function applyTranslations(root) {
        const scope = root || document;
        const lang = getLang();

        // Text nodes
        scope.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            el.textContent = t(key, lang);
        });

        // Attribute translations
        scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const spec = el.getAttribute('data-i18n-attr');
            if (!spec) return;
            spec.split(';').forEach(pair => {
                const parts = pair.split(':').map(s => s.trim());
                if (parts.length !== 2) return;
                const [attr, key] = parts;
                el.setAttribute(attr, t(key, lang));
            });
        });

        // <title> element if it has data-i18n
        const titleEl = document.querySelector('title[data-i18n]');
        if (titleEl) {
            const key = titleEl.getAttribute('data-i18n');
            document.title = t(key, lang);
        }

        document.documentElement.setAttribute('lang', lang);
    }

    function setLang(lang) {
        if (!TRANSLATIONS[lang]) return;
        localStorage.setItem(STORAGE_KEY, lang);
        applyTranslations();
        updateLangButton();
        // Notify listeners (e.g. dynamic loaders, typewriter restart hooks)
        window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    }

    function updateLangButton() {
        const btn = document.getElementById('lang-toggle');
        if (!btn) return;
        const lang = getLang();
        const entry = LANGS.find(l => l.code === lang) || LANGS[0];
        btn.textContent = entry.label + ' ▾';
        btn.setAttribute('aria-label', t('nav.lang_title') + ': ' + entry.name);

        // Mark active option in menu
        const menu = document.getElementById('lang-menu');
        if (menu) {
            menu.querySelectorAll('[data-lang]').forEach(opt => {
                opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
            });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Build the language switcher UI and inject into .nav-controls
    // ─────────────────────────────────────────────────────────────
    function initLangSwitcher() {
        const navControls = document.querySelector('.nav-controls');
        if (!navControls) return;
        if (document.getElementById('lang-toggle')) return; // already built

        const wrap = document.createElement('div');
        wrap.className = 'lang-switcher';

        const btn = document.createElement('button');
        btn.id = 'lang-toggle';
        btn.className = 'lang-toggle';
        btn.type = 'button';
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-expanded', 'false');

        const menu = document.createElement('ul');
        menu.id = 'lang-menu';
        menu.className = 'lang-menu';
        menu.setAttribute('role', 'listbox');

        LANGS.forEach(l => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.setAttribute('data-lang', l.code);
            li.className = 'lang-option';
            li.innerHTML = `<span class="lang-flag">${l.flag}</span><span class="lang-name">${l.name}</span>`;
            // l.flag is trusted (inline SVG defined in this file, not user input).
            li.addEventListener('click', (ev) => {
                ev.stopPropagation();
                setLang(l.code);
                closeMenu();
            });
            menu.appendChild(li);
        });

        wrap.appendChild(btn);
        wrap.appendChild(menu);

        // Insert BEFORE the theme toggle so order is: menu ☰ | EN▾ | ☀
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn && themeBtn.parentNode === navControls) {
            navControls.insertBefore(wrap, themeBtn);
        } else {
            navControls.appendChild(wrap);
        }

        function openMenu() {
            menu.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
        }
        function closeMenu() {
            menu.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }

        btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (menu.classList.contains('open')) closeMenu(); else openMenu();
        });

        document.addEventListener('click', (ev) => {
            if (!wrap.contains(ev.target)) closeMenu();
        });

        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape') closeMenu();
        });

        updateLangButton();
    }

    // ─────────────────────────────────────────────────────────────
    // Hero typewriter: cycles through all greetings, loops forever.
    // Respects prefers-reduced-motion (shows current UI-lang greeting, static).
    // ─────────────────────────────────────────────────────────────
    function initTypewriterCycle() {
        const el = document.getElementById('typewriter');
        if (!el) return;

        const reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion) {
            // Pick the UI-language greeting if we have one, else English.
            const ui = getLang();
            const pick = GREETINGS.find(g => g.lang === ui) || GREETINGS[0];
            el.textContent = pick.text;
            el.setAttribute('dir', pick.dir);
            return;
        }

        const TYPE_SPEED = 90;    // ms per char typing
        const ERASE_SPEED = 45;   // ms per char erasing
        const HOLD_AFTER = 1400;  // pause after fully typed
        const PAUSE_BETWEEN = 250; // pause after fully erased

        let idx = 0;

        function typeOne() {
            const g = GREETINGS[idx];
            el.setAttribute('dir', g.dir);
            el.setAttribute('lang', g.lang);
            // Use Array.from to split by grapheme for multi-byte chars (CJK, emoji-safe)
            const chars = Array.from(g.text);
            let i = 0;
            el.textContent = '';

            function step() {
                if (i < chars.length) {
                    el.textContent += chars[i];
                    i++;
                    setTimeout(step, TYPE_SPEED);
                } else {
                    setTimeout(eraseOne, HOLD_AFTER);
                }
            }
            step();
        }

        function eraseOne() {
            const current = Array.from(el.textContent);
            let i = current.length;

            function step() {
                if (i > 0) {
                    i--;
                    el.textContent = current.slice(0, i).join('');
                    setTimeout(step, ERASE_SPEED);
                } else {
                    idx = (idx + 1) % GREETINGS.length;
                    setTimeout(typeOne, PAUSE_BETWEEN);
                }
            }
            step();
        }

        typeOne();
    }

    // ─────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────
    window.i18n = {
        t,
        getLang,
        setLang,
        applyTranslations,
        LANGS,
        GREETINGS,
        // Return a localized project { title, desc } for the given repo name, or null.
        getProject(repoName) {
            const entry = PROJECTS[repoName];
            if (!entry) return null;
            const lang = getLang();
            return entry[lang] || entry[DEFAULT_LANG] || null;
        },
        // Return ordered experience entries, each fully localized for the active language.
        getExperience() {
            const lang = getLang();
            return EXPERIENCE_ORDER.map((id) => {
                const e = EXPERIENCE[id];
                const loc = e[lang] || e[DEFAULT_LANG];
                return { id, ...e.common, ...loc };
            });
        },
    };

    // Auto-init
    document.addEventListener('DOMContentLoaded', () => {
        applyTranslations();
        initLangSwitcher();
        initTypewriterCycle();
    });
})();
