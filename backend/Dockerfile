# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# Use --no-cache-dir to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY ./app /app/app

# Make port 8000 available to the world outside this container
EXPOSE 8000
# Make UDP ports available for WebRTC ICE candidates (adjust range as needed)
EXPOSE 40000-40050/udp

# Define environment variable (optional, can be set in docker-compose)
# ENV NAME World

# Run main.py when the container launches using Uvicorn
# Use 0.0.0.0 to bind to all interfaces
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
