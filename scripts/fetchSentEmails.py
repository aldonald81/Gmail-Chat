from __future__ import print_function
import os.path
import json
import base64
import pickle
import re
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from email import message_from_bytes, policy
from email.parser import BytesParser

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def main():
    """Pulls sent emails and their prior messages, then stores them in a JSON file."""
    creds = None
    # The token.pickle file stores the user's access and refresh tokens.
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    # Authenticate if credentials are invalid or don't exist.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Authenticate and authorize the user.
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=8080)
        # Save the credentials for future runs.
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    try:
        # Build the Gmail service.
        service = build('gmail', 'v1', credentials=creds)

        # Query to find emails sent from your address.
        query = 'from:adonald8106@gmail.com'
        user_id = 'me'
        all_emails = []

        # Fetch messages matching the query.
        response = service.users().messages().list(userId=user_id, q=query).execute()
        messages = response.get('messages', [])

        # Continue fetching emails if there are more pages.
        while 'messages' in response:
            for msg in response['messages']:
                msg_id = msg['id']
                # Get the full message.
                message = service.users().messages().get(userId=user_id, id=msg_id, format='raw').execute()
                msg_str = base64.urlsafe_b64decode(message['raw'].encode('ASCII'))
                mime_msg = BytesParser(policy=policy.default).parsebytes(msg_str)

                # Extract headers.
                subject = mime_msg['Subject']
                date = mime_msg['Date']
                thread_id = message['threadId']

                # Extract the response body without quoted text.
                response_body = get_message_body(mime_msg)

                # Get the prior message in the thread.
                prior_message_body = ''
                thread = service.users().threads().get(userId=user_id, id=thread_id, format='full').execute()
                messages_in_thread = thread.get('messages', [])

                # Find the message before the current one.
                # Sort messages by internalDate to ensure correct order.
                messages_in_thread.sort(key=lambda x: int(x['internalDate']))
                current_msg_index = None
                for index, m in enumerate(messages_in_thread):
                    if m['id'] == msg_id:
                        current_msg_index = index
                        break

                if current_msg_index is not None and current_msg_index > 0:
                    prior_msg = messages_in_thread[current_msg_index - 1]
                    # Get the full prior message.
                    prior_msg_full = service.users().messages().get(userId=user_id, id=prior_msg['id'], format='raw').execute()
                    prior_msg_str = base64.urlsafe_b64decode(prior_msg_full['raw'].encode('ASCII'))
                    prior_mime_msg = BytesParser(policy=policy.default).parsebytes(prior_msg_str)
                    prior_message_body = get_message_body(prior_mime_msg)

                # Build the email object.
                email_obj = {
                    'id': msg_id,
                    'subject': subject,
                    'date': date,
                    'priorMessage': prior_message_body,
                    'responseBody': response_body
                }
                all_emails.append(email_obj)

            # Check if there's a next page.
            if 'nextPageToken' in response:
                page_token = response['nextPageToken']
                response = service.users().messages().list(userId=user_id, q=query, pageToken=page_token).execute()
            else:
                break

        # Save the emails to a JSON file.
        with open('emails.json', 'w') as f:
            json.dump(all_emails, f, indent=4)

        print("Emails have been saved to emails.json")

    except Exception as e:
        print(f'An error occurred: {e}')

def get_message_body(mime_msg):
    """Extracts the message body and strips quoted text."""
    # Get the plain text part of the email.
    text = ''
    if mime_msg.is_multipart():
        for part in mime_msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get('Content-Disposition'))
            if content_type == 'text/plain' and 'attachment' not in content_disposition:
                text = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                break
    else:
        text = mime_msg.get_payload(decode=True).decode('utf-8', errors='ignore')

    # Strip quoted text.
    clean_text = strip_quoted_text(text)
    return clean_text.strip()

def strip_quoted_text(text):
    """Removes quoted text from an email body."""
    # Patterns to identify quoted text.
    patterns = [
        r'^On\s.+?wrote:$',  # Matches lines like "On Mon, Jan 1, 2024 at 12:00 PM John Doe <john@example.com> wrote:"
        r'^>.*',             # Matches lines starting with ">"
        r'^Sent from my.*',  # Matches common email footers.
        r'^-+Original Message-+$',  # Matches "---Original Message---"
        r'^-----.*$',        # Matches lines starting with "-----"
    ]
    regex = re.compile('|'.join(patterns), re.MULTILINE | re.DOTALL)

    # Split the email body into lines.
    lines = text.split('\n')
    new_lines = []
    skip = False

    for line in lines:
        if regex.match(line):
            skip = True
        if not skip:
            new_lines.append(line)
        # Reset skip when there's an empty line (common in email formatting)
        if line.strip() == '':
            skip = False

    return '\n'.join(new_lines)

if __name__ == '__main__':
    main()
