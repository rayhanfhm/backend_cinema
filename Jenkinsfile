pipeline {
    agent any

    environment {
        // Path workspace Jenkins Windows (atau ganti sesuai direktori tempat file kamu)
        APP_DIR = 'C:\\ProgramData\\Jenkins\\.jenkins\\workspace\\backend-cinema'
    }

    stages {
        stage('Build Backend Image') {
            steps {
                echo "Building updated be-cinema image di ${APP_DIR}..."
                bat "docker compose --project-directory \"%APP_DIR%\" -f \"%APP_DIR%\\docker-compose.yml\" build backend"
            }
        }

        stage('Deploy Backend & Database') {
            steps {
                echo "Deploying Backend & Mongo containers dari ${APP_DIR}..."
                // Menjalankan stack secara utuh
                bat "docker compose --project-directory \"%APP_DIR%\" -f \"%APP_DIR%\\docker-compose.yml\" up -d --build"
            }
        }
    }

    post {
        success {
            echo 'Deployment Backend Cinema & Mongo berhasil!'
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