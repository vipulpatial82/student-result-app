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
                bat 'set "DOCKER_BUILDKIT=0" && docker build --no-cache -t student-result-backend ./backend'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                echo '🐳 Building frontend Docker image...'
                bat 'set "DOCKER_BUILDKIT=0" && docker build --no-cache --build-arg REACT_APP_API_URL=http://localhost:5000 -t student-result-frontend ./frontend'
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo '🛑 Stopping old containers...'
                bat 'docker stop react-frontend || exit 0'
                bat 'docker stop node-backend || exit 0'
                bat 'docker rm react-frontend || exit 0'
                bat 'docker rm node-backend || exit 0'
                bat 'docker network rm app-network || exit 0'
            }
        }

        stage('Run Containers') {
            steps {
                echo '🚀 Starting containers...'
                bat 'docker network create app-network || exit 0'
                bat 'docker run -d -p 5000:5000 --name node-backend --network app-network -e GEMINI_API_KEY=%GEMINI_API_KEY% -e GROK_API_KEY=%GROK_API_KEY% student-result-backend'
                bat 'docker run -d -p 3000:3000 --name react-frontend --network app-network student-result-frontend'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed! App running at http://localhost:3000'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}