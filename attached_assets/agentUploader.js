import AgentsCoordinator from './coordinators/agents.coordinator.js';

const agentsData = {
    'Alejandro Bernal': [
      { MerchantID: 21656251, MerchantName: 'TAQUERIA EL VAQUERO', BankSplit: '0.00%' },
      { MerchantID: 21802590, MerchantName: 'TACOS GARCIA', BankSplit: '0.00%' },
      { MerchantID: 21521729, MerchantName: "JACOBO'S CAFE", BankSplit: '0.00%' },
      { MerchantID: 21827784, MerchantName: 'EL TROPIO -BLVD', BankSplit: '0.00%' },
      { MerchantID: 21652335, MerchantName: 'EL TROPICO', BankSplit: '0.00%' },
      { MerchantID: 21842384, MerchantName: 'LOUIE LOUIES PIANO BAR', BankSplit: '0.00%' },
      { MerchantID: 22037562, MerchantName: 'EL TROPICO PERRYTON-3', BankSplit: '0.00%' }
    ],
    "Cody Burnell": [
      {"MerchantID": 21806568, "MerchantName": "KEY WEST EMPORIUM - 618 DUVAL ST", "BankSplit": "0.35%"},
      {"MerchantID": 21806567, "MerchantName": "KEY WEST EMPORIUM - KAYA ISLAND ", "BankSplit": "0.35%"},
      {"MerchantID": 21806569, "MerchantName": "KEY WEST EMPORIUM - BACKYARD BAR", "BankSplit": "0.35%"},
      {"MerchantID": 21988914, "MerchantName": "FRONT STREET GRILL", "BankSplit": "0.35%"},
      {"MerchantID": 21908920, "MerchantName": "ROOFTOP ON MAIN", "BankSplit": "0.35%"},
      {"MerchantID": 21907161, "MerchantName": "LA CHAPINA RESTAURANT", "BankSplit": "0.35%"},
      {"MerchantID": 21809588, "MerchantName": "REV ROOM", "BankSplit": "0.00%"},
      {"MerchantID": 21788133, "MerchantName": "IBIS BAY WATER SPORTS", "BankSplit": "0.35%"},
      {"MerchantID": 21826686, "MerchantName": "THE KAST NET", "BankSplit": "0.35%"},
      {"MerchantID": 21788132, "MerchantName": "IBIS BAY RESORT", "BankSplit": "0.35%"},
      {"MerchantID": 21862960, "MerchantName": "SAMUELS HOUSE", "BankSplit": "0.35%"},
      {"MerchantID": 21863992, "MerchantName": "CORNERSTONE WORSHIP CENTER", "BankSplit": "0.35%"},
      {"MerchantID": 21872092, "MerchantName": "ANDY AND DAVES GARAGE", "BankSplit": "0.35%"},
      {"MerchantID": 21908649, "MerchantName": "LJS CAFE", "BankSplit": "0.35%"}
    ],
    'Christy Milton': [
      { "MerchantID": 21827927, "MerchantName": "EYE CARE PLUS LLP", "BankSplit": "0.00%" },
      { "MerchantID": 21746156, "MerchantName": "GOLDEN LIGHT BEER GARDEN", "BankSplit": "0.00%" },
      { "MerchantID": 20840981, "MerchantName": "THE 212 CLUB LLC", "BankSplit": "0.00%" },
      { "MerchantID": 21746157, "MerchantName": "GOLDEN LIGHT CANTINA", "BankSplit": "0.00%" },
      { "MerchantID": 21745938, "MerchantName": "WATER TREE-BELL", "BankSplit": "0.00%" },
      { "MerchantID": 21638520, "MerchantName": "WATER TREE-10TH", "BankSplit": "0.00%" },
      { "MerchantID": 21782569, "MerchantName": "THE OPEN CHEER & DANCE", "BankSplit": "0.00%" },
      { "MerchantID": 21802150, "MerchantName": "SP030 - SKYTAB POS TABLE SERVICE", "BankSplit": "0.00%" },
      { "MerchantID": 21820588, "MerchantName": "SP030CM - SKYTAB DEMO TEST", "BankSplit": "0.00%" }
    ],
    'Emma Barre': [
      { MerchantID: 21799921, MerchantName: 'VACATION TOUR AND TRAVEL AGENCY', BankSplit: '0.35%' },
      { MerchantID: 21774587, MerchantName: 'MARCO ESCAPES INC', BankSplit: '0.35%' },
      { MerchantID: 21952076, MerchantName: 'The Porch at Huntington Square', BankSplit: '0.00%' },
      { MerchantID: 21788134, MerchantName: 'GENSCO PHARMA', BankSplit: '0.35%' }
    ],
    'Hailey Clark': [
      { MerchantID: 21943547, MerchantName: 'SPOTTED PONY', BankSplit: '0.00%' },
      { MerchantID: 22052066, MerchantName: 'LOUIE LOUIES PIANO BAR', BankSplit: '0.00%' },
      { MerchantID: 21814861, MerchantName: 'STOCKING ICE CREAM PARLOR', BankSplit: '0.00%' }
    ],
  // add other agents...
};

const createAgents = async () => {
  try {
    for (const [agentName, clients] of Object.entries(agentsData)) {
      const [fName, lName] = agentName.split(' ');
      const agent = {
        fName,
        lName,
        clients: clients.map(client => ({
          merchantID: client.MerchantID,
          merchantName: client.MerchantName,
          bankSplit: client.BankSplit
        }))
      };

      // Create the agent using the AgentsCoordinator
      const result = await AgentsCoordinator.createAgent('org-ad0bfbe7', agent);
      // console.log(`Agent ${fName} ${lName} created:`, result);
    }
  } catch (error) {
    console.error('Error creating agents:', error.message);
  }
};

createAgents();
