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
                          -Dsonar.host.url=http://sonarqube:9000
                    """
                }
            }
        }
        stage('Security') {
            steps {
                echo '=== STAGE 4: SECURITY SCAN ==='
                sh """
                    docker run --rm aquasec/trivy:latest image \
                        --format table \
                        --exit-code 0 \
                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                        ${IMAGE_NAME}:${IMAGE_TAG} > trivy-report.txt 2>&1 || true
                """
                sh 'cat trivy-report.txt'
                archiveArtifacts artifacts: 'trivy-report.txt'
                echo 'Security scan complete - report saved!'
            }
        }
        stage('Deploy to Staging') {
            steps {
                echo '=== STAGE 5: DEPLOY TO STAGING ==='
                sh 'docker stop app-staging || true'
                sh 'docker rm app-staging || true'
                sh "docker run -d -p 3001:3000 --name app-staging ${IMAGE_NAME}:${IMAGE_TAG}"
                sh 'sleep 5'
                sh 'curl -f http://localhost:3001/health'
                echo 'App deployed to staging on port 3001'
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
                        -e NODE_ENV=production \
                        ${IMAGE_NAME}:v${IMAGE_TAG}
                """
                sh 'sleep 5'
                sh 'curl -f http://localhost:3000/health || (docker stop app-prod && exit 1)'
                echo "Released version v${IMAGE_TAG} to production"
            }
        }
        stage('Monitoring') {
            steps {
                echo '=== STAGE 7: MONITORING ==='
                sh 'curl -f http://localhost:3000/health'
                sh 'curl -f http://localhost:3000/'
                sh 'curl -f http://localhost:3000/metrics || echo "Metrics endpoint not yet configured"'
                echo 'All health checks passed - app is live!'
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