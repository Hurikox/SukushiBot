require("dotenv").config({ override: true });
const fs = require("fs");
const path = require("path");
const { Client, Collection, IntentsBitField, REST, Routes, PermissionsBitField } = require("discord.js");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers
    ]
});

client.commands = new Collection();
client.pendingCommands = new Map();
client.snipes = new Map();
client.color = "#028be6";

const commandsPath = path.join(__dirname, "Commandes");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

const WELCOME_CHANNEL_ID = "1506574321978572922";
const GOODBYE_CHANNEL_ID = "1506574365352005695";

client.once("ready", async () => {
    console.log(`${client.user.tag} est connecté.`);

    const commands = client.commands.map(cmd => cmd.data);
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log(`${commands.length} commandes enregistrées globalement.`);
    } catch (error) {
        console.error("Erreur lors de l'enregistrement des commandes :", error);
    }
});

client.on("guildMemberAdd", member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    channel.send(`🎉 Bienvenue ${member} ! Coucou à toi cher Sukuien, j'espère que tu vas apprécier d'être ici. 😊`);
});

client.on("guildMemberRemove", member => {
    const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);
    if (!channel) return;

    channel.send(`😢 Oh tu es déjà parti ? J'espère te revoir et que tu es parti temporairement. À bientôt ${member} !`);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const pendingKey = interaction.user.id;
    let pendingTimeout;
    if (interaction.commandName !== "cancel") {
        client.pendingCommands.set(pendingKey, interaction);
        pendingTimeout = setTimeout(() => {
            if (client.pendingCommands.get(pendingKey) === interaction) {
                client.pendingCommands.delete(pendingKey);
            }
        }, 120000);
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        const hasReplied = interaction.replied || interaction.deferred;
        if (hasReplied) {
            await interaction.followUp({ content: "Une erreur est survenue.", flags: 64 });
        } else {
            await interaction.reply({ content: "Une erreur est survenue.", flags: 64 });
        }
    } finally {
        if (interaction.commandName !== "cancel") {
            client.pendingCommands.delete(pendingKey);
            clearTimeout(pendingTimeout);
        }
    }
});

client.on("messageDelete", message => {
    if (!message || !message.guild || message.author?.bot) return;

    client.snipes.set(message.channel.id, {
        authorTag: message.author.tag,
        authorId: message.author.id,
        content: message.content || "(Aucun texte)",
        channelId: message.channel.id,
        createdAt: message.createdAt,
        deletedAt: new Date(),
        attachment: message.attachments.first()?.proxyURL || null,
    });
});

client.on("error", console.error);
client.on("shardError", console.error);

client.login(process.env.TOKEN);
