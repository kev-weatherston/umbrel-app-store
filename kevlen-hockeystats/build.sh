NAME_FRONTEND=hockeystats
REGISTRYHOST=openregistry.kevlen.me
if [ -d "frontend/.next" ]; then
    echo "🗑️  Clearing Next.js cache..."
    rm -rf frontend/.next
fi
echo "Building..."
docker build -f ./Dockerfile -t $NAME_FRONTEND:latest --rm .
if [ $? -ne 0 ]; then
    echo "🚨 Build failed"
    exit 1
fi
docker image tag $NAME_FRONTEND:latest $REGISTRYHOST/$NAME_FRONTEND:latest
docker push $REGISTRYHOST/$NAME_FRONTEND:latest

