pipeline {
    agent any

    environment {
        APP_NAME = 'backend-cinema'
        DOCKER_IMAGE = 'backend-cinema:latest'
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image ${DOCKER_IMAGE}..."
                    bat "docker build -t ${DOCKER_IMAGE} -f dockerfile ."
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    echo "Creating .env file for deployment..."
                    
                    // Suntikkan isi .env langsung di sini
                    // Ganti teks DI_BAWAH_INI dengan isi asli dari file .env kamu
                    bat '''@echo off
(
echo PORT=3000
echo DB_HOST=cinema-db
echo DB_USER=root
echo DB_PASSWORD=secret
) > .env
'''

                    echo "Deploying backend service using Docker Compose..."
                    bat "docker compose down"
                    bat "docker compose up -d"
                }
            }
        }

        stage('Cleanup Dangling Images') {
            steps {
                script {
                    echo "Cleaning up dangling Docker images..."
                    bat "docker image prune -f"
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline Backend berhasil! Service berjalan di network cinema-net."
        }
        failure {
            echo "Pipeline Gagal! Periksa log Jenkins untuk detailnya."
        }
    }
}