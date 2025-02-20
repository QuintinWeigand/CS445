from ollama import Client

client = Client(
  host='http://192.168.42.21:11434',
  headers={'x-some-header': 'some-value'}
)
response = client.chat(model='llama3.2', messages=[
  {
    'role': 'user',
    'content': 'Why is the sky blue?',
  },
])

print(response['message']['content'])