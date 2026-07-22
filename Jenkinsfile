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