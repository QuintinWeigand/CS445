#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <netdb.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define PORT "3490" // the port client will be connecting to 
#define MAXDATASIZE 100 // max number of bytes we can get at once 

// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int main(int argc, char *argv[])
{
    int sockfd, numbytes;  
    char buf[MAXDATASIZE];
    struct addrinfo hints, *servinfo, *p;
    int rv;
    char s[INET6_ADDRSTRLEN];
    fd_set readfds;
    struct timeval timeout;

    if (argc != 2) {
        fprintf(stderr,"usage: client hostname\n");
        exit(1);
    }

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    // Here we are using the server's ip address that we used in the first argement of the executable. 
    if ((rv = getaddrinfo(argv[1], PORT, &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // loop through all the results and connect to the first we can
    for(p = servinfo; p != NULL; p = p->ai_next) {
        // If an error occurs in these next if statments, we continue which does our increment and trys the loop over again. 
        if ((sockfd = socket(p->ai_family, p->ai_socktype,
                             p->ai_protocol)) == -1) {
            perror("client: socket");
            continue;
        }

        if (connect(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
            perror("client: connect");
            close(sockfd);
            continue;
        }

        break; // If we break that means both the socket creation and binding was successful.
    }

    // If we got through the end of the linked list and did not find anything, we error our and return error code 2
    if (p == NULL) {
        fprintf(stderr, "client: failed to connect\n");
        return 2;
    }

    // Getting the information of our port and making it network to printable to be able print the ip to the screen.
    inet_ntop(p->ai_family, get_in_addr((struct sockaddr *)p->ai_addr),
              s, sizeof s);
    printf("client: connecting to %s\n", s);

    freeaddrinfo(servinfo); // all done with this structure

    // Chat loop
    while(1) {
        // This section allows for input from the user into readfds
        FD_ZERO(&readfds);
        FD_SET(sockfd, &readfds);
        FD_SET(STDIN_FILENO, &readfds);  // Add stdin to fd_set to read user input

        // We have a timeout of a second to avoid spamming and unaccounted for errors
        timeout.tv_sec = 1;
        timeout.tv_usec = 0;

        int activity = select(sockfd + 1, &readfds, NULL, NULL, &timeout);

        if (activity < 0) {
            perror("select");
            exit(1);
        }

        // If something to read from the server we save the size of the input and print it to the client
        if (FD_ISSET(sockfd, &readfds)) {
            numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0);
            if (numbytes == -1) {
                perror("recv");
                exit(1);
            }
            buf[numbytes] = '\0';
            printf("Received from server: %s\n", buf);
        }

        // If the client types something we read the whole line from stdin and send it to the server respectivly
        if (FD_ISSET(STDIN_FILENO, &readfds)) {
            
            fgets(buf, MAXDATASIZE, stdin);

            if (send(sockfd, buf, strlen(buf), 0) == -1) {
                perror("send");
                exit(1);
            }
        }
    }

    // Close the socket the client made
    close(sockfd);

    return 0;
}
