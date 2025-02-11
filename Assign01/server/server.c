// Server.c (This will handle both clients and send messages back and forth to the clients)

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define BACKLOG 10

void error(const char *msg) {
    perror(msg);
    exit(1);
}

int main(int argc, char *argv[]) {
    // In this we take the port as an argument (this can easily change with a constant defined port)

    if(argc != 2) {
        fprintf(stderr, "Port number not provided or argument count was incorrect. Program Terminated\n");
        exit(1);
    }

    int sockfd, newsockfd, port, n;
    char buffer[256];

    struct sockaddr_in serv_addr, cli_addr;
    socklen_t clilen;

    sockfd = socket(AF_INET, SOCK_STREAM, 0); // Using TCP (SOCK_STREAM)
    if(sockfd < 0) {
        // Socket creation resulted in an error
        error("Error opening a socket!");
    }

    memset((char *) &serv_addr, 0, sizeof(serv_addr)); // Zero out whatever garbage we took when staticly allocating
    
    port = atoi(argv[1]); // We get the port from the argument (we can change later if desired)

    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = INADDR_ANY;
    serv_addr.sin_port = htons(port); // Converted the port to a readable number to a network equivallent

    if(bind(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) < 0) {
        error("Binding failed!");
    }

    listen(sockfd, BACKLOG); // Listening for the client to connect
    clilen = sizeof(cli_addr);

    printf("Waiting for connection of port %d...\n", port);

    newsockfd = accept(sockfd, (struct sockaddr *) &cli_addr, &clilen);

    if(newsockfd < 0) {
        error("Error on Accept");
    }

    char *client_ip = inet_ntoa(cli_addr.sin_addr);
    printf("Connection established! Client IP: %s\n", client_ip);

    while(1) {
        memset(buffer, 0, sizeof(buffer));
        n = read(newsockfd, buffer, sizeof(buffer));
        if(n < 0) {
            error("Error on reading to buffer from client");
        }

        if (strlen(buffer) > 0 && buffer[strlen(buffer) - 1] == '\n') {
            buffer[strlen(buffer) - 1] = '\0';
        }

        printf("Client : %s\n", buffer);
        memset(buffer, 0, sizeof(buffer));

        printf("Please enter your message: ");
        fgets(buffer, sizeof(buffer), stdin);

        n = write(newsockfd, buffer, strlen(buffer));
        if(n < 0) {
            error("Error on writing to client");
        }

        int i = strncmp("Bye", buffer, 3);
        if(i == 0) {
            break;
        }
    }

    close(newsockfd);
    close(sockfd);

    return 0;
}