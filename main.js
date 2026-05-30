require("dotenv").config();
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

client.on("error", console.error);
client.on("shardError", console.error);

client.login(process.env.TOKEN);
