pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }
    environment {
        IMAGE_NAME = "my-devops-app"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    stages {
        stage('Build') {
            steps {
                echo '=== STAGE 1: BUILD ==='
                sh 'npm ci'
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                echo "Docker image built: ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
        stage('Test') {
            steps {
                echo '=== STAGE 2: TEST ==='
                sh 'npm test -- --ci'
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'junit.xml'
                }
            }
        }
        stage('Code Quality') {
            steps {
                echo '=== STAGE 3: CODE QUALITY ==='
                withSonarQubeEnv('SonarQube') {
                    sh """
                        npx sonar-scanner \
                          -Dsonar.projectKey=my-devops-app \
                          -Dsonar.sources=. \
                          -Dsonar.exclusions=node_modules/**,coverage/** \
                          -Dsonar.host.url=http://sonarqube:9000 \
                          -Dsonar.token=sqp_43899c58c6e1886613c29814516821f5d47c7c2d
                    """
                }
            }
        }
        stage('Security') {
            steps {
                echo '=== STAGE 4: SECURITY SCAN ==='
                sh """
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:latest image \
                        --format table \
                        --exit-code 0 \
                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                        ${IMAGE_NAME}:${IMAGE_TAG} 2>&1 | tee trivy-report.txt || true
                """
                archiveArtifacts artifacts: 'trivy-report.txt'
                echo 'Security scan complete - report saved!'
            }
        }
        stage('Deploy to Staging') {
            steps {
                echo '=== STAGE 5: DEPLOY TO STAGING ==='
                sh 'docker stop app-staging || true'
                sh 'docker rm app-staging || true'
                sh "docker run -d -p 3001:3000 --name app-staging --network devops-network ${IMAGE_NAME}:${IMAGE_TAG}"
                sh 'sleep 8'
                sh 'docker exec app-staging wget -q -O- http://localhost:3000/health'
                echo 'App deployed to staging successfully!'
            }
        }
        stage('Release to Production') {
            steps {
                echo '=== STAGE 6: RELEASE TO PRODUCTION ==='
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:v${IMAGE_TAG}"
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
                sh 'docker stop app-prod || true'
                sh 'docker rm app-prod || true'
                sh """
                    docker run -d -p 3000:3000 \
                        --name app-prod \
                        --network devops-network \
                        -e NODE_ENV=production \
                        ${IMAGE_NAME}:v${IMAGE_TAG}
                """
                sh 'sleep 8'
                sh 'docker exec app-prod wget -q -O- http://localhost:3000/health'
                echo "Released version v${IMAGE_TAG} to production!"
            }
        }
        stage('Monitoring') {
            steps {
                echo '=== STAGE 7: MONITORING ==='
                sh 'docker exec app-prod wget -q -O- http://localhost:3000/health'
                sh 'docker exec app-prod wget -q -O- http://localhost:3000/'
                sh 'docker exec app-prod wget -q -O- http://localhost:3000/metrics | head -5'
                sh 'docker ps | grep app-prod'
                echo 'All health checks passed - app is live and monitored!'
            }
        }
    }
    post {
        success {
            echo 'Pipeline SUCCEEDED! All 7 stages completed successfully.'
        }
        failure {
            echo 'Pipeline FAILED. Check the stage logs above for errors.'
        }
    }
}