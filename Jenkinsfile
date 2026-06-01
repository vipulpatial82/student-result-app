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

        stage('Build Backend Docker Image') {
            steps {
                echo '🐳 Building backend Docker image...'
                sh 'docker build -t student-result-backend ./backend'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                echo '🐳 Building frontend Docker image...'
                sh 'docker build --build-arg REACT_APP_API_URL=http://localhost:5000 -t student-result-frontend ./frontend'
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo '🛑 Stopping old containers...'
                sh 'docker stop react-frontend || true'
                sh 'docker stop node-backend || true'
                sh 'docker rm react-frontend || true'
                sh 'docker rm node-backend || true'
                sh 'docker network rm app-network || true'
            }
        }

        stage('Run Containers') {
            steps {
                echo '🚀 Starting containers...'
                sh 'docker network create app-network || true'
                sh 'docker run -d -p 5000:5000 --name node-backend --network app-network -e GEMINI_API_KEY=$GEMINI_API_KEY -e GROK_API_KEY=$GROK_API_KEY student-result-backend'
                sh 'docker run -d -p 3000:3000 --name react-frontend --network app-network student-result-frontend'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully! App running at http://localhost:3000'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
