import socket
from ollama import Client

# Create ollama Client
client = Client(
    host='150.156.81.61',
    headers={'x-some-header': 'some-value'}
)

context = []

# Create socket and get server's IP
serv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
hostname = socket.gethostname()
serv_ip = socket.gethostbyname(hostname)

# Bind to incoming connections (looks for 5 connections)
serv.bind((serv_ip, 8080))
serv.listen(5)

while True:
  # Accept incoming connections
  conn, addr = serv.accept()
  from_client = ''
  while True:
    # Receive from client(s)
    data = conn.recv(4096)

    # If client sends nothing leave the loop
    if not data: break

    # Print client response
    from_client = data.decode('utf8')
    print (f'Llama Client: {from_client}' + '\n')
    print("---------------------------------------------------------------\n")

    # Add client prompt to context
    context.append(from_client)

    # Get AI response and send to client
    context_string = " ".join(context)

    response = client.chat(model='llama3.2', messages=[
    {
      'role': 'user',
      'content': context_string,
    },
    ])
    content = response.message.content
    print("Llama Server: " + content + "\n")
    print("---------------------------------------------------------------\n")
    context.append(content)
    context_string = ""
    conn.send(content.encode())

    # Close connection to client
    if from_client == "bye" or from_client == "Bye":
      conn.close()

  break