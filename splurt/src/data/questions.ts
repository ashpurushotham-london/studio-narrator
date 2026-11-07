/**
 * Question database.
 *
 * Every prompt is written as `'Prompt text | example answers separated by spaces'`.
 * The example answers are never shown to the player. They exist so the engine can
 * check that a restriction can really be satisfied for a prompt (see logic/engine.ts)
 * and so the test-suite can prove every generated challenge is answerable.
 */

export type CategoryId =
  | 'everyday'
  | 'food'
  | 'animals'
  | 'places'
  | 'people'
  | 'entertainment'
  | 'sport'
  | 'nature'
  | 'transport'
  | 'abstract'
  | 'funny'
  | 'lateral';

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  /** 1 = easy, 2 = medium, 3 = brain-twister */
  level: 1 | 2 | 3;
}

export const CATEGORIES: Category[] = [
  { id: 'everyday', name: 'Everyday objects', emoji: '🔧', level: 1 },
  { id: 'food', name: 'Food and drink', emoji: '🍕', level: 1 },
  { id: 'animals', name: 'Animals', emoji: '🦒', level: 1 },
  { id: 'places', name: 'Places', emoji: '🗺️', level: 1 },
  { id: 'people', name: 'People and professions', emoji: '🧑‍🚀', level: 2 },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', level: 2 },
  { id: 'sport', name: 'Sport', emoji: '⚽', level: 2 },
  { id: 'nature', name: 'Nature', emoji: '🌳', level: 1 },
  { id: 'transport', name: 'Transport', emoji: '🚲', level: 1 },
  { id: 'abstract', name: 'Abstract concepts', emoji: '💭', level: 2 },
  { id: 'funny', name: 'Funny and unusual', emoji: '🤪', level: 2 },
  { id: 'lateral', name: 'Lateral thinking', emoji: '🧠', level: 3 },
];

export interface Question {
  id: string;
  text: string;
  category: CategoryId;
  level: 1 | 2 | 3;
  /** Lower-case example answers (single words). Never shown to players. */
  answers: string[];
  /** Whether a plural form of a typical answer makes sense (countable things). */
  countable: boolean;
}

const RAW: Record<CategoryId, string[]> = {
  everyday: [
    'Something you find in a kitchen | spoon fork knife plate kettle toaster oven fridge whisk colander',
    'An object with buttons | remote calculator shirt keyboard phone coat microwave jacket radio lift',
    'Something that makes noise | alarm horn drum siren bell whistle thunder radio engine trumpet',
    'Something you would take on holiday | suitcase passport sunscreen camera towel swimsuit sunglasses book charger map',
    "Something you wouldn't want to forget | keys wallet passport phone birthday password umbrella anniversary homework medicine",
    'Something you find in a bathroom | toothbrush soap shower towel mirror toilet sink shampoo bath razor',
    'Something you plug in | kettle charger lamp toaster television laptop fridge heater speaker hairdryer',
    'Something with a screen | phone television laptop tablet monitor cinema calculator watch console microwave',
    'Something you find in a bedroom | bed pillow duvet wardrobe lamp mattress blanket alarm curtains drawer',
    'Something you wear on your feet | shoes socks boots sandals slippers trainers flippers heels clogs skates',
    'Something you carry around with you | bag wallet umbrella backpack phone keys suitcase basket purse torch',
    'Something that is usually round | ball plate wheel clock coin pizza button ring globe bowl',
    'Something with a handle | mug door suitcase broom hammer bucket pan umbrella kettle drawer',
    'Something you find in a toolbox | hammer screwdriver spanner pliers saw drill wrench nails tape chisel',
    'Something that has a lid | jar pot saucepan box bin teapot bottle coffin laptop casket',
    'Something you find in a school bag | pencil ruler book sandwich calculator folder eraser pen lunchbox planner',
    'Something you find in a garden | shed flower lawn spade hose bench fence pond rake gnome',
    'Something that runs on batteries | torch remote toy clock camera radio drone watch calculator doorbell',
    'Something you hang on a wall | picture clock mirror shelf poster calendar painting frame tapestry hook',
    'Something that comes in pairs | shoes socks gloves earrings glasses twins scissors trousers chopsticks dice',
    'Something you can fold | paper shirt towel chair map napkin origami laundry letter blanket',
    'Something sharp | knife needle razor thorn scissors pin axe blade cactus dagger',
  ],
  food: [
    'A type of fruit | apple banana orange grape mango pear cherry lemon peach plum',
    'A type of cheese | cheddar brie edam feta gouda stilton mozzarella parmesan camembert halloumi',
    'Something you eat for breakfast | cereal toast porridge bacon eggs pancakes muffin yoghurt croissant bagel',
    'A hot drink | tea coffee cocoa latte espresso cappuccino mocha chai macchiato',
    'A type of pasta | spaghetti penne fusilli lasagne macaroni ravioli tagliatelle linguine farfalle rigatoni',
    'A vegetable | carrot potato onion broccoli cabbage pea leek celery spinach turnip',
    'Something you put on a pizza | cheese pepperoni mushroom olives pineapple onion ham tomato peppers anchovies',
    'A sweet treat | cake cookie candy fudge brownie toffee doughnut sweets lollipop pudding',
    'Something sour | lemon lime vinegar rhubarb grapefruit pickle sherbet yoghurt cranberry gooseberry',
    'Something spicy | chilli curry pepper wasabi mustard salsa paprika ginger horseradish tabasco',
    'A type of bread | baguette bagel naan ciabatta sourdough toast pitta roll loaf focaccia',
    "Something you'd find in a sandwich | cheese ham lettuce tomato butter chicken tuna cucumber bacon egg",
    'A cold drink | lemonade juice cola milkshake smoothie water squash soda slush cider',
    'A nut or seed | almond walnut cashew peanut pistachio hazelnut pecan sesame sunflower chestnut',
    'A type of soup | tomato minestrone chowder broth gazpacho mushroom leek pumpkin lentil noodle',
    'Something you eat with your hands | pizza burger sandwich chips popcorn taco wings sushi crisps corn',
    'A dessert | trifle tiramisu cheesecake sundae pavlova crumble gateau brownie mousse sorbet',
    "Something you'd have at a barbecue | sausage burger kebab corn steak ribs coleslaw chicken marshmallow ketchup",
    'A fast food item | burger fries nuggets milkshake hotdog wrap pizza taco chips kebab',
    'Something you can bake | cake bread biscuit pie scone muffin cookie tart potato lasagne',
    'A type of berry | strawberry raspberry blueberry blackberry cranberry gooseberry mulberry blackcurrant elderberry loganberry',
    'A condiment | ketchup mustard mayonnaise vinegar relish salsa mayo pesto chutney tabasco',
  ],
  animals: [
    'A farm animal | cow pig sheep goat horse chicken duck turkey donkey llama',
    'An animal with a long neck | giraffe swan goose ostrich llama flamingo camel heron crane',
    'An animal that lives in water | fish whale shark dolphin octopus seal crab eel squid turtle',
    'A bird | robin eagle owl parrot sparrow penguin swan pigeon crow hawk',
    'An insect | ant bee wasp beetle fly butterfly moth ladybird cricket mosquito',
    'A popular pet | dog cat hamster rabbit goldfish parrot gerbil tortoise budgie ferret',
    'An animal with stripes | zebra tiger skunk bee wasp okapi badger chipmunk bass',
    'A predator | lion tiger shark wolf eagle crocodile cheetah hawk leopard python',
    'An animal that hibernates | bear hedgehog squirrel bat dormouse frog snake tortoise bumblebee marmot',
    'An animal found in Africa | lion elephant giraffe zebra rhino hippo cheetah gorilla hyena meerkat',
    'An animal with a pouch | kangaroo koala wombat opossum wallaby possum quokka bandicoot',
    'A reptile | snake lizard crocodile turtle gecko iguana tortoise alligator chameleon python',
    'An animal that can fly | bird bat bee eagle owl butterfly wasp moth sparrow hawk',
    'An animal that lives somewhere cold | penguin walrus seal reindeer moose husky puffin caribou',
    'A baby animal | puppy kitten calf lamb cub foal piglet chick tadpole fawn',
    'A rodent | mouse rat hamster squirrel beaver gerbil porcupine capybara chipmunk vole',
    'A sea creature with lots of legs | octopus crab lobster shrimp squid prawn krill',
    'A nocturnal animal | owl bat badger fox hedgehog moth possum raccoon aardvark lemur',
    "An animal from a children's story | wolf rabbit bear fox tortoise hare pig mouse caterpillar duck",
    'A slow animal | sloth snail tortoise turtle slug manatee',
    'A dangerous animal | shark snake lion crocodile scorpion hippo spider tiger bear wasp',
    "An animal you'd see at the zoo | lion giraffe monkey elephant penguin zebra panda gorilla tiger flamingo",
  ],
  places: [
    'A country in Europe | france spain italy germany poland sweden norway greece ireland portugal',
    'A capital city | london paris rome madrid berlin tokyo cairo lima oslo dublin',
    'Somewhere you go on holiday | beach resort hotel campsite cruise cabin island safari spain paris',
    'A room in a house | kitchen bathroom bedroom lounge hallway attic cellar garage study conservatory',
    'A place where you queue | bank cinema supermarket airport bakery checkout pharmacy museum',
    'A type of shop | bakery butcher florist pharmacy bookshop supermarket jeweller newsagent chemist',
    'A famous landmark | pyramids stonehenge colosseum parthenon acropolis alcatraz kremlin',
    'A place that should be quiet | library church museum cemetery forest monastery temple meadow',
    'A place that is loud | stadium concert nightclub playground airport factory festival market',
    'A country in Asia | japan china india thailand vietnam korea nepal malaysia mongolia indonesia',
    'A US state | texas ohio alaska florida hawaii nevada utah maine california oregon',
    'An island | iceland cuba malta jamaica madagascar tasmania greenland cyprus bali sicily',
    'A place where you can swim | pool lake sea ocean river lagoon beach bath pond lido',
    "Somewhere you'd find lots of books | library bookshop school study classroom archive museum",
    'A place to relax | spa beach sofa garden park hammock bath cabin retreat sauna',
    'A famous city | paris venice rome vegas tokyo sydney amsterdam barcelona dubai istanbul',
    'A part of a castle | tower moat dungeon drawbridge battlements keep turret courtyard gatehouse rampart',
    "Somewhere you wouldn't want to get lost | forest desert jungle maze mountain ocean airport city cave",
    "Somewhere you'd find in a town | bank library school park church cinema market station hospital pub",
    'A famous mountain or mountain range | everest alps andes himalayas kilimanjaro snowdon fuji matterhorn rockies',
    'A very hot place | desert sahara sauna oven tropics volcano kitchen equator beach',
    'A place with lots of water | ocean lake river sea waterfall lagoon pool swamp bay reservoir',
  ],
  people: [
    'A job that helps other people | nurse doctor teacher firefighter paramedic carer counsellor dentist',
    'A job where you wear a uniform | police nurse pilot soldier chef referee waiter postman firefighter',
    'A job you do outdoors | farmer gardener builder postman lifeguard roofer ranger fisherman',
    'A famous scientist | einstein newton darwin curie galileo tesla hawking edison pasteur',
    'A famous musician | beyonce elvis adele madonna prince bowie mozart beethoven dylan eminem',
    'A famous actor | depp cruise hanks streep pitt jolie dicaprio freeman washington stone',
    'A member of a family | mother father sister brother uncle aunt cousin grandma grandad niece',
    'A famous world leader | churchill lincoln gandhi mandela napoleon caesar cleopatra thatcher',
    'Someone who works in a hospital | nurse doctor surgeon porter paramedic midwife radiographer pharmacist consultant',
    "Someone you'd see at a wedding | bride groom vicar bridesmaid guest photographer usher florist",
    'A creative job | artist writer designer musician chef architect actor photographer sculptor',
    'A fictional detective | holmes poirot marple columbo morse clouseau rebus maigret',
    'A job with lots of travelling | pilot driver courier sailor trucker steward captain diplomat',
    'A royal title | king queen prince princess duke duchess emperor baron earl countess',
    "Someone you'd call in an emergency | police firefighter paramedic plumber electrician doctor locksmith coastguard",
    'A famous explorer | columbus magellan cook armstrong shackleton livingstone amundsen drake',
    'Someone you find at a school | teacher pupil headteacher caretaker student cook librarian governor',
    'A member of an orchestra | violinist cellist conductor flautist drummer pianist trumpeter harpist oboist',
    'A job where you work with your hands | carpenter plumber builder potter welder tailor mechanic baker electrician',
    'A famous painter | picasso monet rembrandt dali warhol rothko turner matisse constable',
    'A superhero | superman batman spiderman hulk thor flash storm wolverine',
    'A character from a fairy tale | cinderella goldilocks rapunzel pinocchio gretel hansel rumpelstiltskin',
  ],
  entertainment: [
    'A famous movie | titanic avatar jaws frozen shrek grease alien psycho rocky inception',
    'A game you can play alone | solitaire patience sudoku crossword tetris minesweeper puzzle jigsaw',
    'A board game | monopoly cluedo scrabble chess risk draughts backgammon battleships',
    'A cartoon character | mickey donald goofy bugs scooby homer bart garfield popeye tweety',
    'A musical instrument | piano guitar violin drum flute trumpet harp saxophone cello clarinet',
    'A TV genre | comedy drama thriller sitcom documentary horror soap western quiz reality',
    'A Disney film | frozen bambi dumbo aladdin moana tangled mulan pinocchio cinderella encanto',
    'A superhero film | batman superman spiderman avengers ironman deadpool aquaman hulk',
    'A card game | poker bridge snap rummy whist hearts blackjack solitaire uno pontoon',
    'A famous band | queen abba oasis blur coldplay metallica nirvana genesis kiss',
    'A video game | tetris minecraft mario zelda fortnite pacman sonic doom halo pokemon',
    'A type of dance | waltz tango salsa ballet disco jive foxtrot rumba samba tap',
    "Something you'd see at a circus | clown acrobat juggler lion trapeze tent ringmaster elephant unicyclist magician",
    'Something a magician uses | wand hat rabbit cards cape scarf coin mirror box handkerchief',
    "A children's TV show | peppa teletubbies bluey sesame thomas pingu arthur dora",
    'A genre of music | rock pop jazz blues country reggae folk techno disco punk',
    'A fictional wizard | gandalf merlin dumbledore potter saruman rincewind',
    'A famous book | hamlet dracula matilda ulysses emma frankenstein dune twilight',
    'Something you find at a theme park | rollercoaster carousel waltzers teacups candyfloss queue mascot turnstile fireworks',
    "Something you'd see at the cinema | popcorn screen trailer seats usher projector film nachos ticket curtains",
    'A film villain | joker voldemort vader hannibal scar jafar thanos ursula gargamel',
    "An act on a talent show | singer dancer magician juggler comedian acrobat ventriloquist impressionist",
  ],
  sport: [
    'A sport played with a ball | football tennis golf rugby cricket netball basketball volleyball baseball hockey',
    'A winter sport | skiing skating curling snowboarding sledging bobsleigh luge hockey biathlon',
    'An Olympic sport | swimming archery fencing judo rowing gymnastics boxing cycling diving athletics',
    'A piece of sports equipment | racket bat helmet net goalpost puck shuttlecock paddle stumps javelin',
    'A sport played in or on water | swimming diving waterpolo surfing rowing kayaking sailing snorkelling canoeing',
    'A team sport | football rugby netball hockey cricket basketball volleyball baseball relay',
    'A sport played on a court | tennis badminton squash basketball volleyball netball handball pickleball',
    'A famous athlete | bolt federer ronaldo messi ali phelps jordan beckham',
    'A sport with a net | tennis badminton volleyball football hockey basketball netball',
    'A track and field event | sprint javelin discus hurdles marathon relay shotput',
    'Something a referee uses | whistle card flag watch notebook coin pencil',
    'A sport played with a stick or bat | hockey cricket baseball golf lacrosse rounders softball polo croquet',
    'A position in football | striker goalkeeper defender midfielder winger sweeper fullback',
    'A martial art | karate judo taekwondo kungfu aikido boxing wrestling capoeira jujitsu sumo',
    'Something you do on wheels | skating cycling skateboarding rollerblading karting motocross',
    'A famous sporting event | wimbledon olympics superbowl derby ashes paralympics masters daytona',
    'A piece of gym equipment | treadmill dumbbell barbell kettlebell mat bench rope',
    'Something you can win | trophy medal cup prize lottery raffle race argument bet award',
    'A word used in tennis | deuce love ace serve volley lob rally set smash',
    'A sport that needs lots of space | golf cricket skiing rugby polo sailing football archery',
    'An extreme sport | skydiving bungee surfing climbing paragliding snowboarding rafting skateboarding',
    'Something you do to warm up | stretch jog lunge squat jump skip bend run',
  ],
  nature: [
    'A type of tree | oak ash birch pine willow maple elm beech cedar yew',
    'A flower | rose daisy tulip lily daffodil poppy orchid sunflower lavender bluebell',
    'A natural disaster | earthquake flood tornado tsunami hurricane drought avalanche wildfire eruption landslide',
    'Something you see in the sky | cloud sun moon star rainbow plane bird comet kite lightning',
    'A type of weather | rain snow fog sunshine hail wind storm drizzle thunder frost',
    'A body of water | lake river sea ocean pond stream lagoon bay canal puddle',
    'Something you find on a beach | sand shell pebble crab seaweed towel bucket spade driftwood starfish',
    'Something you find in a forest | tree moss fern mushroom squirrel owl deer path bluebell log',
    'A type of rock or mineral | granite marble quartz flint slate coal diamond limestone basalt chalk',
    'A planet or heavenly body | mars venus earth jupiter saturn neptune mercury moon sun uranus',
    'Something you see in autumn | leaves conkers acorns pumpkin mist harvest fog bonfire',
    'Something you see in winter | snow frost icicle sleet snowman robin ice scarf mittens fog',
    'Something that grows | plant child tree hair beard fingernail mushroom grass',
    'A type of cloud | cumulus stratus cirrus nimbus cumulonimbus altostratus',
    'Something green | grass frog emerald lime leaf pea cucumber moss broccoli shamrock',
    'Something blue | sky sea sapphire bluebell jeans blueberry whale smurf ocean denim',
    'Something yellow | sun banana lemon daffodil canary butter custard sunflower mustard duckling',
    'Something found underground | roots worm mole tunnel cave coal treasure fossil mine bunker',
    'Something that glows | sun moon firefly candle lamp star lava torch ember lightning bulb',
    'Something wet | rain river sea puddle sponge ocean bath dew lake swamp',
    'Something prickly | cactus hedgehog thorn holly porcupine nettle thistle gorse bramble rose',
    'Something you find in a desert | cactus sand camel dune oasis scorpion mirage tumbleweed lizard snake',
  ],
  transport: [
    'A form of public transport | bus train tram metro tube ferry coach taxi subway monorail',
    'Something with wheels | car bike bus wheelbarrow skateboard trolley pram scooter suitcase wagon',
    'Something that flies | plane helicopter bird kite drone balloon rocket glider jet butterfly',
    'A car brand | ford toyota honda audi fiat volvo tesla bmw mini jaguar',
    'A part of a car | engine wheel brake clutch bonnet boot bumper gearbox steering mirror',
    "A car feature you'll never understand | clutch gearbox carburettor sensor dashboard indicator mirror warning cruise",
    "Something you'd find at an airport | runway passport luggage terminal gate pilot customs trolley",
    'Something you find at a train station | platform ticket timetable train barrier guard track bench kiosk',
    'A type of boat | yacht canoe ferry kayak submarine dinghy tanker barge gondola liner',
    'Something you ride | bike horse bus train rollercoaster camel scooter elephant wave skateboard',
    'A road sign | stop yield roundabout crossing speed junction hazard diversion bend',
    'Something you drive | car bus van lorry tractor taxi tank truck ambulance minibus',
    'Something with a flashing light | ambulance siren beacon indicator lighthouse camera disco police',
    'A way to travel on water | boat ferry ship canoe kayak raft yacht swim surf cruise',
    'A way to travel on holiday | plane cruise coach train ferry car campervan caravan',
    'Something that needs fuel | car plane stove lighter rocket engine generator boat lawnmower motorbike',
    'Something with two wheels | bike bicycle motorbike scooter moped segway rickshaw tandem',
    "Something you'd find on a ship | anchor sail deck mast cabin captain porthole crew compass lifeboat",
    'A part of a bicycle | pedal saddle chain handlebars bell brake spoke tyre basket light',
    'Something you see on a motorway | lorry services junction lane cone barrier bridge sign car coach',
    'Something very fast | cheetah rocket jet bullet lightning falcon sprinter ferrari',
    'A vehicle for the snow | sledge sleigh snowmobile toboggan snowplough skis gritter',
  ],
  abstract: [
    'A common fear | spiders heights darkness clowns snakes needles flying failure germs lifts',
    'A positive emotion | joy happiness love pride hope excitement delight bliss gratitude calm',
    'A negative emotion | anger sadness fear jealousy guilt envy grief shame boredom disgust',
    'Something you can lose | keys game temper weight wallet patience phone sleep hope time',
    'Something you can save | money time energy file life game water memory seat score',
    "Something you can't see | air wind love thought gravity sound radio time smell wifi",
    'Something you can catch | cold ball bus fish train thief flu wave butterfly breath',
    'Something you can break | promise record heart silence rule glass bone habit bank ice',
    'Something that is free | air hugs sunshine samples breathing smile wifi advice laughter water',
    "Something you can't live without | water air food sleep love shelter oxygen friends phone hope",
    'A virtue | honesty patience kindness courage loyalty humility generosity integrity wisdom',
    'A word meaning very large | huge enormous gigantic vast massive colossal immense giant mammoth jumbo',
    'A word meaning very small | tiny minute miniature minuscule petite wee microscopic little teeny pocket',
    'A unit of measurement | metre gram litre inch mile ounce pound second kilo hectare',
    'A word meaning happy | glad cheerful joyful delighted merry jolly content elated thrilled upbeat',
    'Something with a beginning and an end | story film journey race book life game song week road',
    "Something you do when you're nervous | sweat fidget blush tremble pace stutter gulp fumble",
    'Something you can give | present gift hug advice love blood help change time kiss',
    'A period of time | second minute hour day week month year decade century millennium',
    'A colour | red blue green yellow purple orange pink black white turquoise',
    'A shape | circle square triangle oval hexagon rectangle diamond pentagon star cube',
    'Something you can count | sheep stars money steps calories votes beans blessings days pennies',
  ],
  funny: [
    "Something you'd find in a villain's lair | lasers throne minions volcano trapdoor shark dungeon",
    'Something embarrassing to be caught doing | singing dancing snoring burping crying napping lying sneezing',
    "Something you'd hate to find in your sandwich | hair wasp slug spider cockroach plaster worm bug",
    'A good name for a pet goldfish | bubbles nemo goldie flipper finn splash wanda sushi dory wiggles',
    "Something you'd hear in a haunted house | creak scream whisper moan rattle howl cackle thud footsteps chain",
    'Something that is hard to eat gracefully | spaghetti burger noodles corn soup ribs watermelon mango lobster',
    'A terrible superpower | sneezing burping smelling itching blinking yawning snoring mumbling',
    'Something that smells awful | sock garbage skunk drain egg cheese fish bin sewage cabbage',
    'Something you would see at a very weird party | clown llama dinosaur pirate unicorn robot wizard alien banana gorilla',
    'Something you should never put in a microwave | metal foil egg grapes spoon fork plastic lighter',
    'A silly word | wobble giggle bamboozle kerfuffle flabbergasted hullabaloo gobbledygook squiggle discombobulate wiggle',
    'Something that makes you laugh | joke clown tickle comedy meme prank pun cartoon blooper fall',
    'Something you find down the back of the sofa | coins remote crumbs pen sweets biscuit crayon earring button hair',
    "Something you'd hate to find in your shoe | custard jelly spaghetti beans pudding egg soup jam yoghurt gravy",
    "Something you'd take to a desert island | boat radio knife book water matches rope compass fishing guitar",
    'Something you say when you stub your toe | ouch ow yikes argh darn blimey crikey flipping dang bother',
    'A good name for a dragon | smaug puff draco fang blaze ember inferno spike toothless scorch',
    'Something hard to do on a first date | listen impress flirt dance chew relax talk eat',
    'A terrible excuse for being late | traffic alarm dog flood bus sheep aliens strike',
    'Something you see on a bad hair day | frizz knots tangles mess fringe quiff curls spikes cowlick static',
    'A noise a pirate would make | arr ahoy aye yarr avast matey yoho',
    "Something you'd find in a clown's car | horn wig balloons shoes custard flower confetti",
  ],
  lateral: [
    'Something that has a neck but no head | bottle guitar shirt violin jumper cello vase sweater',
    "Something that has hands but can't clap | clock watch glove stopwatch scarecrow mannequin",
    'Something that has teeth but cannot bite | comb saw zip cog gear rake key fork',
    'Something that has an eye but cannot see | needle storm hurricane potato camera typhoon cyclone',
    'Something that gets wetter the more it dries | towel cloth flannel sponge napkin',
    'Something you can hold without touching it | breath grudge conversation attention secret',
    'Something that gets bigger the more you take away | hole gap debt shadow trench pit dent',
    'Something that goes up but never comes down | age price inflation rent tax bill',
    'Something with keys but no locks | piano keyboard map typewriter computer laptop organ accordion',
    'Something that runs but never walks | river nose tap water engine tights clock program',
    'Something with a face but no eyes | clock watch coin cliff dice mountain moon card',
    "Something you can't keep until you give it | word promise oath vow pledge",
    'Something that has a bed but never sleeps | river garden hospital seabed oyster',
    'Something that has a bank but no money | river canal stream lake brook',
    'Something that can be cracked but not broken | joke code egg safe whip knuckle smile case password',
    'Something you can see through | window glass water air ghost lens jellyfish tights',
    'Something always in front of you but never seen | future tomorrow horizon air destiny',
    'Something that has a spine but no bones | book cactus hedgehog notebook album binder',
    "Something that has legs but doesn't walk | table chair bed tripod trousers stool desk piano pants",
    'Something you can crack open | nut safe window can crab coconut bottle lock',
    'Something that fills a room but takes up no space | light sound smell air music noise laughter silence echo',
    'Something full of holes | sponge net sieve colander cheese doughnut flute',
    'A word that is both a noun and a verb | run walk book play drink dance paint hope love water',
    'Something that gets shorter as it gets older | candle pencil crayon soap fuse lollipop',
  ],
};

const CATEGORY_LEVEL = new Map(CATEGORIES.map((c) => [c.id, c.level]));
const COUNTABLE: ReadonlySet<CategoryId> = new Set<CategoryId>([
  'everyday',
  'food',
  'animals',
  'nature',
  'transport',
  'funny',
]);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parse(): Question[] {
  const out: Question[] = [];
  for (const category of Object.keys(RAW) as CategoryId[]) {
    for (const line of RAW[category]) {
      const [text, answerPart = ''] = line.split('|').map((s) => s.trim());
      out.push({
        id: `${category}:${slugify(text)}`,
        text,
        category,
        level: CATEGORY_LEVEL.get(category) ?? 1,
        answers: answerPart.split(/\s+/).filter(Boolean),
        countable: COUNTABLE.has(category),
      });
    }
  }
  return out;
}

export const QUESTIONS: readonly Question[] = parse();
export const QUESTION_MAP: ReadonlyMap<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]));
