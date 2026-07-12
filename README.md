# PDS WhatsApp Bot

This project provides a WhatsApp bot that replies with document links from a GitHub-hosted JSON file.

## Run locally

\`\`\`bash
npm install
node index.js
\`\`\`

## Deploying 24/7

This bot is best hosted on a cloud service such as:
- Railway
- Render
- Oracle Cloud
- Heroku

For a production deployment, you should use a managed service and a persistent environment with a stable Chrome runtime.

## Deploying to Oracle Cloud

This application is designed to be deployed as a Docker container. Here are the steps to deploy it to Oracle Cloud using Oracle Kubernetes Engine (OKE) or Container Instances.

### Prerequisites

1.  An Oracle Cloud Infrastructure (OCI) account.
2.  \`docker\` CLI installed and configured.
3.  \`oci\` CLI installed and configured.
4.  \`kubectl\` installed and configured to connect to your OKE cluster.

### 1. Build and Push the Docker Image

1.  **Build the Docker image:**

    \`\`\`bash
    docker build -t pds-bot:latest .
    \`\`\`

2.  **Create a repository in Oracle Cloud Infrastructure Registry (OCIR):**

    You can do this through the OCI Console or using the \`oci\` CLI.

3.  **Log in to OCIR:**

    \`\`\`bash
    docker login <region-key>.ocir.io -u <tenancy-namespace>/<username> -p <auth-token>
    \`\`\`

    -   \`<region-key>\`: The key for your OCI region (e.g., \`iad\` for Ashburn).
    -   \`<tenancy-namespace>\`: Your tenancy's object storage namespace.
    -   \`<username>\`: Your OCI username.
    -   \`<auth-token>\`: An auth token generated in your OCI user settings.

4.  **Tag and push the image to OCIR:**

    \`\`\`bash
    docker tag pds-bot:latest <region-key>.ocir.io/<tenancy-namespace>/pds-bot:latest
    docker push <region-key>.ocir.io/<tenancy-namespace>/pds-bot:latest
    \`\`\`

### 2. Deploy to Oracle Kubernetes Engine (OKE)

This is the recommended approach for production deployments as it provides scalability and resilience.

1.  **Create a Persistent Volume (PV) and Persistent Volume Claim (PVC):**

    To ensure your WhatsApp session is not lost when the pod restarts, you need to store the authentication data in a persistent volume.

    Create a file named \`pvc.yaml\`:

    \`\`\`yaml
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: pds-bot-pvc
    spec:
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
    \`\`\`

    Apply it to your cluster:

    \`\`\`bash
    kubectl apply -f pvc.yaml
    \`\`\`

2.  **Create a Deployment:**

    Create a file named \`deployment.yaml\`:

    \`\`\`yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: pds-bot-deployment
    spec:
      replicas: 1
      selector:
        matchLabels:
          app: pds-bot
      template:
        metadata:
          labels:
            app: pds-bot
        spec:
          containers:
          - name: pds-bot
            image: <region-key>.ocir.io/<tenancy-namespace>/pds-bot:latest
            ports:
            - containerPort: 3000
            env:
            - name: WWEBJS_AUTH_PATH
              value: /app/.wwebjs_auth
            volumeMounts:
            - name: auth-volume
              mountPath: /app/.wwebjs_auth
          volumes:
          - name: auth-volume
            persistentVolumeClaim:
              claimName: pds-bot-pvc
    \`\`\`

    -   Replace \`<region-key>\` and \`<tenancy-namespace>\` with your OCIR details.

    Apply it to your cluster:

    \`\`\`bash
    kubectl apply -f deployment.yaml
    \`\`\`

3.  **Create a Service:**

    To expose the application, create a \`LoadBalancer\` service.

    Create a file named \`service.yaml\`:

    \`\`\`yaml
    apiVersion: v1
    kind: Service
    metadata:
      name: pds-bot-service
    spec:
      type: LoadBalancer
      ports:
      - port: 80
        targetPort: 3000
      selector:
        app: pds-bot
    \`\`\`

    Apply it to your cluster:

    \`\`\`bash
    kubectl apply -f service.yaml
    \`\`\`

    It will take a few minutes for the Load Balancer to be provisioned and get a public IP address. You can check the status with \`kubectl get services\`.

### 3. (Alternative) Deploy as a Container Instance

For simpler deployments, you can use OCI Container Instances. You will need to use a block volume to persist the authentication data. The setup is more manual and involves creating a block volume, attaching it to the container instance, and configuring the mount path.

## Usage

Send messages like:
- \`/tds Terraco\`
- \`/tds FOSROC\`
