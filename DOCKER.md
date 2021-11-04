#Docker

To run chat-bridge with docker, ensure that [docker](https://docs.docker.com/engine/install/) and (docker-compose)[https://docs.docker.com/compose/install/] is installed.

Then run

```sh
docker-compose up -d
```

After successful build it would generate a `config.json`. Modify `config.json` to suit your need then run again

```sh
docker-compose up -d
```

If Messenger is configurated, the first boot after it's configurated will save the session of Messenger and shut itself down automatically. Don't panic, just boot it again and it's all right.

To see log run

```sh
docker-compose logs -f
```
