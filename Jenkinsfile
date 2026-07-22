pipeline {
    agent any

    environment {
        // Path direktori tempat file .env kamu berada di Windows
        SOURCE_ENV_DIR = 'C:\\Users\\stefa\\Downloads\\backend_cinema'
    }

    stages {
        stage('Copy .env File') {
            steps {
                script {
                    echo "Mengopi file .env dari ${SOURCE_ENV_DIR} ke workspace Jenkins..."
                    // Mengopi file .env dari folder Downloads ke workspace Jenkins saat ini
                    bat "copy /Y \"${SOURCE_ENV_DIR}\\.env\" .env"
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                script {
                    echo "Building Docker image backend..."
                    // Menggunakan bat dan menambahkan --load agar image tersimpan di lokal Docker
                    bat "docker compose build --load backend-cinema"
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
            echo 'Deployment Backend Cinema berhasil!'
        }
        failure {
            echo 'Deployment Backend gagal. Periksa log Jenkins.'
        }
        always {
            // Membersihkan dangling images bekas build
            bat 'docker image prune -f'
        }
    }
}