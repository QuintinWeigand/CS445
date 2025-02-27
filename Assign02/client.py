import socket
import sys
from ollama import Client

if not sys.argv[1]:
    print("Proper usage: python3 client.py SERVER_IP")
    exit(1)

# Create socket and get server IP
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serv_ip = sys.argv[1]

# Connect to server
client.connect((serv_ip, 8090))


while(True):
    # Send prompt to server
    prompt = input("User: ")
    if prompt == "bye" or prompt == "Bye": break
    print("\n")

    client.send(prompt.encode())

    # Receive from server
    response = client.recv(4096)
    print ("Llama: " + response.decode())
    print("---------------------------------------------------------------\n")


# Close connection to server
client.close()