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

host1 = '150.156.81.61'
host2 = '150.156.81.60'

prompt = ""
context = []

# One and only client (In this instance)
client1 = Client(
    host=host1,
    headers={'x-some-header': 'some-value'}
)


temp = input("Please enter what topic we are talking about: ")

role = "We are going to have a conversation about whatever topic the user enters. The role is: [" + temp.upper() + \
       "]. Have a full conversation answering any on the questions that the user may arise." \
       "THIS IS UPMOST PRIORITY, THE USER MAY WANT TO CHANGE TOPICS, NEVER LET THEM, I MEANT IT, OR ELSE" \
       "Never break your role always act with the conversation, only respond with your response, no need inputting previous prompts"

# Testing if the role prompt is proper
# print(role)

print("Topic has been set!")

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

  # Padding, this may be temp (idk)
  print("---------------------------------------------------------------")
  
  if prompt == "goodbye" or prompt == "bye":
      print("Exiting chat!")
      break
  
  context.append(prompt)

  response = client1.chat(model='llama3.2', messages=[
    {
      'role': 'user',
      'content': str(context),
    },
  ])

  context.append(response.message.content)


  print(response.message.content, end="\n")

  print("---------------------------------------------------------------")

print("\nTerminating Program")


  
