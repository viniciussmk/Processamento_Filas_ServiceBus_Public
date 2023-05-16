// String de conexão
const { ServiceBusClient } = require("@azure/service-bus");
const { mainModule } = require("process");
const serviceBusClient = new ServiceBusClient("Endpoint");


//Conexão pra DeadLetter
async function main(){
  const deadLetterReceiverForSubscription = serviceBusClient.createReceiver("revenue.charge.bankslip.sendexchangeprotheus", "SendExchangeProtheus", {
    subQueueType: "deadLetter",
    receiveMode: "receiveAndDelete"
  });


//Busca a fila
  const deadLetterSenderForSubscription = serviceBusClient.createSender("revenue.charge.bankslip.sendexchangeprotheus");
  

//Retira mensagem da DLQ 
  const msgReceived = await deadLetterReceiverForSubscription.receiveMessages(15);

//Lopping 
  for (let i = 0; i < msgReceived.length; i++){
    
    var message = ({
      body: JSON.parse(JSON.stringify(msgReceived[i].body)),
      customProperties: {
          messagenumber: i
      }
    })

    try{      
      let batch = await deadLetterSenderForSubscription.createMessageBatch()
      batch.tryAddMessage(message)
      let saida = await deadLetterSenderForSubscription.sendMessages(batch)
    } 
    catch(e) {
      console.log("erro" + e.message)
    }
  } 

//Aguarda todo o processo ser realizado antes de fechar o Client
  await deadLetterSenderForSubscription.close();
  await serviceBusClient.close()
} 

main()