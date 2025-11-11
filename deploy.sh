#!/bin/bash

# Configuration
EC2_HOST="ubuntu@ec2-3-210-177-245.compute-1.amazonaws.com"
PEM_FILE="Serambiente-KPair-NV.pem"
REMOTE_DIR="/home/ubuntu/als"

# Create remote directory
echo "Creating remote directory..."
ssh -i "$PEM_FILE" $EC2_HOST "mkdir -p $REMOTE_DIR"

# Copy necessary files
echo "Copying files to EC2 instance..."
scp -i "$PEM_FILE" -r \
    Dockerfile.frontend \
    Dockerfile.backend \
    docker-compose.yml \
    docker-compose.prod.yml \
    .env.prod \
    $EC2_HOST:$REMOTE_DIR/

# Copy frontend and backend directories
scp -i "$PEM_FILE" -r front/ $EC2_HOST:$REMOTE_DIR/
scp -i "$PEM_FILE" -r back/ $EC2_HOST:$REMOTE_DIR/

# Install Docker and Docker Compose on the EC2 instance if not already installed
echo "Setting up Docker on EC2 instance..."
ssh -i "$PEM_FILE" $EC2_HOST "
    if ! command -v docker &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y docker.io
        sudo systemctl enable --now docker
        sudo usermod -aG docker $USER
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
"

# Build and start the containers
echo "Building and starting containers..."
ssh -i "$PEM_FILE" $EC2_HOST "
    cd $REMOTE_DIR
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
"

echo "Deployment complete!"
echo "Your application should be available at: http://ec2-3-210-177-245.compute-1.amazonaws.com"
