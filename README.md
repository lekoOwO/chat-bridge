# Chat Bridge
A chat bridge between Telegram, Messenger and IRC.

## Usage
```sh
npm install
node main.js
```

The first time you execute this, it'll generate `config.json` automatically.

Configurate it correctlly and run it again

```sh
node main.js
```

If Messenger is configurated, the first boot after it's configurated will save the session of Messenger and shut itself down automatically. Don't panic, just boot it again and it's all right.

## Docker
To run with Docker read [DOCKER.md](DOCKER.md)

## Localize

Currently Chinese (Taiwan) only.

Feel free to send a PR!
