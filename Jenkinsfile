pipeline {
    agent any

    environment {
        GEMINI_API_KEY = credentials('GEMINI_API_KEY')
        GROK_API_KEY = credentials('GROK_API_KEY')
    }

    stages {

        stage('Clone Repository') {
            steps {
                echo '📥 Cloning repository...'
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                echo '📦 Installing backend dependencies...'
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo '📦 Installing frontend dependencies...'
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo '🔨 Building React app...'
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                echo '🐳 Building backend Docker image...'
                sh 'docker build -t student-result-backend ./backend'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                echo '🐳 Building frontend Docker image...'
                sh 'docker build -t student-result-frontend ./frontend'
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo '🛑 Stopping old containers...'
                sh 'docker stop react-frontend || true'
                sh 'docker stop node-backend || true'
                sh 'docker rm react-frontend || true'
                sh 'docker rm node-backend || true'
            }
        }

        stage('Run Containers') {
            steps {
                echo '🚀 Starting containers...'
                sh 'docker run -d -p 5000:5000 --name node-backend -e GEMINI_API_KEY=$GEMINI_API_KEY -e GROK_API_KEY=$GROK_API_KEY student-result-backend'
                sh 'docker run -d -p 3000:3000 --name react-frontend student-result-frontend'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}