# sample python3 ollama API script
# used venv
# python3 -m venv ollama-test
# ./ollama-test/bin/python3 -m pip install ollama


from ollama import Client

# client = Client(
#   host='127.0.0.1',
#   headers={'x-some-header': 'some-value'}
# )
# response = client.chat(model='llama3.2', messages=[
#   {
#     'role': 'user',
#     'content': 'Why is the sky blue?',
#   },
# ])

# print(response['message']['content'])
# # or access fields directly from the response object
# print(response.message.content)



prompt = ""
context = []

# One and only client (In this instance)
client1 = Client(
    host='150.156.81.61',
    headers={'x-some-header': 'some-value'}
)

role = input("Please notify the agent: ")

print(f"We will talk about {role}")

# Initial agent topic selection
job = {
   'role': 'system',
   'content': role
}

# Pushing to context
context.append(job)

# Main loop
while(True):
  prompt = input("Please enter your prompt: ")
  
  if prompt == "goodbye":
      print("Exiting chat!")
      break
  
  context.append(prompt)

  # Just checking for now
  prompt = ""

  response = client1.chat(model='llama3.2', messages=[
    {
      'role': 'user',
      'content': str(context),
    },
  ])

  context.append(response.message)

  print("Printing Message!!!")
  print(response.message)
  
