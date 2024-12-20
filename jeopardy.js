const BASE_API_URL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6; // get random category from API.  Returns array of category ids
const NUM_CLUES_PER_CAT = 5; // In each category there are 5 questions.


let categories = []; // the main data structure for the app
// categories is the main data structure for the app; it looks like this:
//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

// Generates categories from API
async function getCategoryIds() {
    let res = await axios.get(`${BASE_API_URL}categories`, {
        params: { count: 100 } // Can ask for up to 100 categories to keep it random
    });
    let catIds = res.data.map(c => c.id);
    return _.sampleSize(catIds, NUM_CATEGORIES); // the _.sampleSize helps keep it to the recommended 6 categories.
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    let res = await axios.get(`${BASE_API_URL}category`, {
        params: { id: catId }
    });
    let newCat = res.data;
    let shuffleClues = _.sampleSize(newCat.clues, NUM_CLUES_PER_CAT).map(c => ({
        question: c.question,
        answer: c.answer,
        showing: null
    }));
    return { title: newCat.title, clues: shuffleClues }; 
}


// Fills HTML table
async function fillTable() {
    hideLoadingView(); // Hides loading screen

    // thead filled with <tr> for categories
    let $tr = $("<tr>");
    for (let category of categories) {
        $tr.append($("<th>").text(category.title));
    }
    $("#jeopardy thead").append($tr);

    // tbody filled with questions
    $("#jeopardy tbody").empty();
    for (let qIndex = 0; qIndex < NUM_CLUES_PER_CAT; qIndex++) {
        let $tr = $("<tr>");
        for (let catIndex = 0; catIndex < NUM_CATEGORIES; catIndex++) {
            $tr.append(
                $("<td>").attr("id", `${catIndex}-${qIndex}`).append($("<div>").addClass("spin").text("100"))
            );
        }
        $("#jeopardy tbody").append($tr);
    }
}

// Handle clicking on a clue: show the question or answer.

// handleClick - when you click the tile, a question is shown. Click again for answer.
function handleClick(evt) {
    let $tgt = $(evt.target);
    let addId = $tgt.attr("id");
    let [catId, clueIndex] = addId.split("-");
    let clue = categories[catId].clues[clueIndex];

    let message;
// if null, show question and set .showing to question
    if (!clue.showing) { 
        message = clue.question;
        clue.showing = "question";
    } 
    // After question is showing, set .showing to answer
    else if (clue.showing === "question") {
        message = clue.answer;
        clue.showing = "answer";
        $tgt.addClass("disabled");
    } 
    // if it already shows .answer, ignore further clicks
    else {
        return;
    }

    $tgt.html(message); // In HTML, this changes the text from the question text to the answer text in the td
}

function showLoadingView() {
    // Handles load and reset. When you click restart, it returns a fresh board
    $("#jeopardy thead").empty();
    $("#jeopardy tbody").empty();

    // When the page is loading the board, a circle loading screen appears before the board generates
    $("#rotate").show();
    $("#start")
    .addClass("disabled")
    .text("loading......");
}


function hideLoadingView() {
    $("#start").removeClass("disabled").text("Restart"); // changes start button to restart when board is loaded
    $("#rotate").hide(); // dismisses the circle loading screen
}


// Handles start of game -> Click Start -> loads with showLoadingView -> getCategoryIds gets questions -> fillTable populates table
async function setupAndStart() {
    let setup = $("#start").text() === "---Loading---";

    if (!setup) {
        showLoadingView();

        let catIds = await getCategoryIds();

        categories = [];

        for (let catId of catIds) {
            categories.push(await getCategory(catId));
        }
        fillTable();
    }
}


$("#start").on("click", setupAndStart); // On click of start/restart button, sets up new game


// On page load, add event handler for clicking clues
$(async function() {
    $("#jeopardy").on("click", "td", handleClick);
});