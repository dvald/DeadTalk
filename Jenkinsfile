pipeline {
    agent any
    environment {
        DOCKER_HOST = "unix:///run/docker.sock"
    }
    options {
        disableConcurrentBuilds()
    }
    stages {
        
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Start MongoDB') {
            steps {
                dir('jenkins-utils/mongodb') {
                    sh 'docker-compose up -d'
                }
            }
        }
        stage('Start Redis') {
            steps {
                dir('jenkins-utils/redis') {
                    sh 'docker-compose up -d'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('web-application/backend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('web-application/backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('web-application/frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Test Frontend') {
            steps {
                dir('web-application/backend') {
                    sh 'npm test'
                }
            }
        }
        

        stage('Deploy to Test Server') {
            when {
                branch 'develop'
            }
            steps {
                sh """ssh bisite@project.air-institute.com 'cd /home/bisite/project && \\
                     git add --all && \\
                     git reset --hard && \\
                     git checkout origin/develop && \\
                     git pull origin develop && \\
                     cd web-application/backend && \\
                     npm install && \\
                     npm run build && \\
                     npm run setup-mongo && \\
                     cd ../frontend && \\
                     npm install && \\
                     npm run build && \\
                     sudo systemctl stop project && \\
                     sudo systemctl start project'"""
            }
        }

        stage('Deploy to Production Server') {
            when {
                branch 'master'
            }
            steps {
                sh """ssh bisite@project.air-institute.com 'cd /home/bisite/project && \\
                     git add --all && \\
                     git reset --hard && \\
                     git checkout origin/master && \\
                     git pull origin master && \\
                     cd web-application/backend && \\
                     npm install && \\
                     npm run build && \\
                     npm run setup-mongo && \\
                     cd ../frontend && \\
                     npm install && \\
                     npm run build && \\
                     sudo systemctl stop project && \\
                     sudo systemctl start project'"""
            }
        }
    }
    post {
        always {
            dir('jenkins-utils/mongodb') {
                sh 'docker-compose down -v'
            }
            dir('jenkins-utils/redis') {
                sh 'docker-compose down -v'
            }
        }
    }
}
