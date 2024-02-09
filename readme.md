## Team Name: CODE CRAFTERS
# Institution Name: International University of Business Agriculture and Technology

Team Member 1:rakibulhasan99445@gmail.com
Team Member 2:m.alinkon10@gmail.com
Team Member 3:bakhtiarfahim360@gmail.com


## zip file name CODE_CRAFTERS


Notes about Judging Process:

If a compose file exists in the zip, Judge engine will run `docker compose up -d --build`.
It is highly recommended that you add a compose file as it reduces chances of making a mistake.
Otherwise, Judge will build the solution and run a standalone container

docker build --tag=sol:latest .

docker run -dit -p 8000:8000 --rm --name=sol sol:latest