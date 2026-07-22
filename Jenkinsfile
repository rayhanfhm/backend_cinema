pipeline {
    agent any

    stages {
        stage('Checkout Source Code') {
            steps {
                checkout scm
            }
        }

        stage('Create .env File') {
            steps {
                script {
                    echo "Membuat file .env di workspace Jenkins..."
                    
                    // Menyuntikkan seluruh variabel environment secara lengkap
                    bat '''@echo off
(
echo PORT=1975
echo NODE_ENV=development
echo MONGO_URI=mongodb://mongo:27017/cinema_booking_db
echo JWT_SECRET=node_js_noName_1975_aboutYou
echo JWT_EXPIRES_IN=1d
echo JWT_COOKIE_EXPIRES_IN=1
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=465
echo SMTP_EMAIL=moonlightsonata.dev@gmail.com
echo SMTP_PASSWORD=rpogododliwfrfyt
echo FRONTEND_URL=http://localhost:3000
) > .env
'''
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    echo "Building Docker image backend..."
                    bat "docker compose build"
                }
            }
        }

        stage('Deploy Backend & Database') {
            steps {
                script {
                    echo "Deploying containers..."
                    bat "docker compose down"
                    bat "docker compose up -d"
                }
            }
        }
    }

    post {
        success {
            echo "Deployment Backend Cinema & Database berhasil!"
        }
        failure {
            echo "Deployment Backend gagal. Periksa log Jenkins."
        }
        always {
            // Membersihkan dangling images bekas build
            bat "docker image prune -f"
        }
    }
}