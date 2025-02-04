#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <sys/wait.h>
#include <signal.h>

#define PORT "3490"  // the port users will be connecting to
#define BACKLOG 10   // how many pending connections queue will hold

// Function to handle SIGCHLD to prevent zombies (no longer necessary in this case)
void sigchld_handler(int s)
{
    int saved_errno = errno;
    while(waitpid(-1, NULL, WNOHANG) > 0);
    errno = saved_errno;
}

// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }
    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int main(void)
{
    // We create a socket file descriptor and create 2 empty socket connections that we will inevtiably allow
    int sockfd, new_fd[2];
    struct addrinfo hints, *servinfo, *p;
    struct sockaddr_storage their_addr; // connector's address information
    socklen_t sin_size;
    struct sigaction sa;
    int yes=1;
    char s[INET6_ADDRSTRLEN];
    int rv;

    // Settings hints memory address to 0
    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC; // We do not specify IPv4 or IPv6
    hints.ai_socktype = SOCK_STREAM; // Using the TCP protocol
    hints.ai_flags = AI_PASSIVE; // use my IP

    // Here we are using our IP (NULL) because WE ARE the server
    if ((rv = getaddrinfo(NULL, PORT, &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // Loop through all the results and bind to the first we can
    for(p = servinfo; p != NULL; p = p->ai_next) {
        // We try to create a socket
        if ((sockfd = socket(p->ai_family, p->ai_socktype,
                p->ai_protocol)) == -1) {
            perror("server: socket");
            continue;
        }

        // Makes sure we are able to reuse the socket
        if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &yes,
                sizeof(int)) == -1) {
            perror("setsockopt");
            exit(1);
        }

        // We try to bind the socket
        if (bind(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
            close(sockfd);
            perror("server: bind");
            continue;
        }

        // If we break, we successfully created a socker and binded the socket
        break;
    }

    freeaddrinfo(servinfo); // all done with this structure

    // Socket wasn't created, so we just exit the program with error code 2
    if (p == NULL)  {
        fprintf(stderr, "server: failed to bind\n");
        exit(1);
    }

    // We try to listen to the socket, if we fail we return 1;
    if (listen(sockfd, BACKLOG) == -1) {
        perror("listen");
        exit(1);
    }

    sa.sa_handler = sigchld_handler; // reap all dead processes
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    if (sigaction(SIGCHLD, &sa, NULL) == -1) {
        perror("sigaction");
        exit(1);
    }

    printf("server: waiting for connections...\n");

    while(1) {  // main accept() loop
        sin_size = sizeof their_addr;
        // We go through each client and accpet their socket
        for (int i = 0; i < 2; i++) {
            new_fd[i] = accept(sockfd, (struct sockaddr *)&their_addr, &sin_size);
            if (new_fd[i] == -1) {
                perror("accept");
                continue;
            }

            // Print the address of the client connected (network to printable)
            inet_ntop(their_addr.ss_family,
                get_in_addr((struct sockaddr *)&their_addr),
                s, sizeof s);
            printf("server: got connection from %s\n", s);
        }

        // Now we are sure that that both of our sockets are connected and are able to send and recieve
        if (fork() == 0) {  // Child process
            close(sockfd); // Child doesn't need the listener

            // Forward messages between both clients, our buffer size was 1024
            char buf[1024];
            int bytes_received;

            while (1) {
                // Wait for data from either client
                for (int i = 0; i < 2; i++) {
                    bytes_received = recv(new_fd[i], buf, sizeof(buf), 0);
                    if (bytes_received <= 0) {
                        printf("Client %d disconnected or error\n", i + 1);
                        close(new_fd[0]);
                        close(new_fd[1]);
                        exit(0);
                    }

                    // Forward message to the other client
                    int other_client = (i == 0) ? 1 : 0;
                    send(new_fd[other_client], buf, bytes_received, 0);
                }
            }
        }
        // Parent process doesn't need the new sockets
        close(new_fd[0]);
        close(new_fd[1]);
    }

    return 0;
}
