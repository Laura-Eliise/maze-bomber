<!-- ctrl + shift + v to preview -->
# Maze Bomber


## A remake of the popular game [Bomberman](https://en.wikipedia.org/wiki/Bomberman) as a student project @[kood/Johvi](https://kood.tech/).


## **Table of Contents**
* ### [General Information](#general-information-1)
* ### [Technologies Used](#technologies-used-1)
* ### [Features](#features-1)
* ### [Setup](#setup-1)
* ### [Usage](#usage-1)
* ### [Acknowledgements](#acknowledgements-1)


## **General Information**

This is a remake of the popular game called **Playing with fire 2**. We have used their original assets. The frontend part is built with our own student web-framework caled Mist.js. The backend game engine is implemented in Golang. 

## Technologies Used
[TypeScript](https://www.typescriptlang.org/)

[Golang](https://go.dev/)

[Vite](https://vitejs.dev/)

[Docker](https://www.docker.com/)

[Mist.js](no-link)

## **Features**
- Global & lobby chats
- Original assets & sounds
- Lobby creation and joining lobbies via code


## **Setup**
Clone the repo
```
https://01.kood.tech/git/nimi25820/bomberman-dom.git
```

### **Manually**
Rename .env-example files to .env and fill them up as expected

Open two terminals

Navigate to ./client on one of them
```bash
cd /client
```
Install node modules
```
npm install --omit=dev
```
Run a Vite server
```
npm run dev
```
Navigate to ./server on the other

```bash
cd /server
```
Start a Golang server
```
go run server.go
```

# Enjoy a good game of bomberman =)

## Acknowledgements
- Our fellow students Olari project =)
- [Multyplayer game engine](https://www.gabrielgambetta.com/client-server-game-architecture.html )


## Authors
- Leonard Ladva
- Laura-Eliise Marrandi
- Robert Kris Laur
- Gunta Kļava