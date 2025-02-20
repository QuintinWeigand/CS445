#!/home/ronny/./ollama-test/bin/python3

# sample python3 ollama API script
# used venv
# python3 -m venv ollama-test
# ./ollama-test/bin/python3 -m pip install ollama


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
# or access fields directly from the response object
print(response.message.content)