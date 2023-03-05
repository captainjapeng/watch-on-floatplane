FROM denoland/deno:1.31.1
WORKDIR /app
USER deno

COPY main.ts  .
RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-env", "main.ts"]
