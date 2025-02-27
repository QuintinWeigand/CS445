import socket
import sys
import time
from ollama import Client

if not sys.argv[1]:
    print("Proper usage: python3 client.py SERVER_IP")
    exit(1)

mins = float(input("How long would you like the conversation to run for (min): "))
secs = mins * 60
start_time = time.time()
end_time = start_time + secs

# Create ollama Client
ollama_client = Client(
    host='150.156.81.61',
    headers={'x-some-header': 'some-value'}
)

context = []

# Create socket and get server IP
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serv_ip = sys.argv[1]

# Connect to server
client.connect((serv_ip, 8090))

first_prompt = input("Tell the AI what you want it to be: ")
first_prompt += " you must respond with answers less than 100 words."
client.send(first_prompt.encode())
context.append(first_prompt + "\n")

curr_time = 0
while(curr_time < end_time):
    curr_time = time.time()

    # Receive from server
    response = client.recv(4096)
    response = response.decode()
    context.append(response + "\n")
    context_string = " ".join(context)

    print ("Llama Server: " + response + "\n")
    print("---------------------------------------------------------------\n")

    new_prompt = ollama_client.chat(model='llama2-uncensored', messages=[
    {
      'role': 'user',
      'content': response + " you must respond with less than 100 words",
    },
    ])
    new_prompt = new_prompt.message.content
    print("Llama Client: " + new_prompt + "\n")
    print("---------------------------------------------------------------\n")
    time.sleep(2)
    client.send(new_prompt.encode())
    context.append(new_prompt + "\n")

# Close connection to server
client.close()