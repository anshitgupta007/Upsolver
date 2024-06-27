document.addEventListener('DOMContentLoaded', () => {


    const MAX_REQUESTS_PER_SECOND = 0.5;
    const REQUEST_INTERVAL = 2000 / MAX_REQUESTS_PER_SECOND;

    document.getElementById('handle-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const handle = document.getElementById('handle').value;

        getUnsolvedProblems(handle);
    });

    async function getUnsolvedProblems(handle) {


        const resultsDiv = document.getElementById('results');
        const tagChartContainer = document.getElementById('chart-container');


        resultsDiv.innerHTML = 'Loading...';
        tagChartContainer.innerHTML = '';

        try {
            // Fetch user submissions
            const submissions = await fetchSubmissions(handle);


            // Determine unsolved problems
            const unsolvedProblems = findUnsolvedProblems(submissions);


            // Organize problems by rating
            const problemsByRating = filterbyRating(unsolvedProblems);

            // Display results and graph
            displayResults(problemsByRating, resultsDiv);
            displayGraph(unsolvedProblems, tagChartContainer);
        } catch (error) {
            resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;

        }
    }

    async function fetchSubmissions(handle) {


        try {
            //fetch from cf api
            const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status !== 'OK') {
                throw new Error('Failed to fetch user submissions');
            }

            return data.result;
        } catch (error) {
            console.error('Error fetching user submissions:', error);
            throw error;
        }
    }


    function findUnsolvedProblems(submissions) {

        //create a set to store solved problems
        const solvedProblems = new Set();
        const unsolvedProblems = {};

        // Iterate over submissions to determine solved problems
        submissions.forEach(submission => {
            const problemId = `${submission.problem.contestId}-${submission.problem.index}`;

            // Check if the problem has been solved
            if (submission.verdict === 'OK') {
                solvedProblems.add(problemId);
            }
        });

        //  find unsolved problems
        submissions.forEach(submission => {
            const problemId = `${submission.problem.contestId}-${submission.problem.index}`;

            // Check if the problem is not solved and not already added as unsolved
            if (submission.verdict !== 'OK' && !solvedProblems.has(problemId)) {
                if (!unsolvedProblems[problemId]) {
                    unsolvedProblems[problemId] = submission;
                }
            }
        });

        return Object.values(unsolvedProblems);
    }

    function filterbyRating(unsolvedProblems) {


        const problemsByRating = {};

        unsolvedProblems.forEach(problem => {
            const rating = problem.problem.rating || 'Unrated';

            if (!problemsByRating[rating]) {
                problemsByRating[rating] = [];
            }

            problemsByRating[rating].push(problem);
        });

        return problemsByRating;
    }

    function displayResults(problemsByRating, resultsDiv) {


        resultsDiv.innerHTML = '';

        Object.keys(problemsByRating).forEach(rating => {
            const problems = problemsByRating[rating];

            if (problems.length > 0) {

                const ratingSection = document.createElement('div');
                ratingSection.classList.add('rating-section');

                // Header for the rating section
                const ratingHeader = document.createElement('h3');
                ratingHeader.textContent = `Rating:${rating} problems`;
                ratingSection.appendChild(ratingHeader);

                // List for problems
                const ul = document.createElement('ul');
                problems.forEach(problem => {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `https://codeforces.com/problemset/problem/${problem.problem.contestId}/${problem.problem.index}`;
                    link.textContent = `${problem.problem.contestId}-${problem.problem.index}: ${problem.problem.name}`;
                    link.target = '_blank'; // Open link in new tab
                    li.appendChild(link);
                    ul.appendChild(li);
                });

                ratingSection.appendChild(ul);
                resultsDiv.appendChild(ratingSection);
            }
        });
    }

    function displayGraph(unsolvedProblems, chartContainer) {


        const tagsCount = {};
        chartContainer.innerHTML = ''; 

        // Count occurrences of each tag
        unsolvedProblems.forEach(problem => {
            problem.problem.tags.forEach(tag => {
                if (!tagsCount[tag]) {
                    tagsCount[tag] = 0;
                }
                tagsCount[tag]++;
            });
        });

        // Extract labels (tags) and data (counts)
        const labels = Object.keys(tagsCount);
        const data = Object.values(tagsCount);

        // Create a canvas element for the chart
        const ctx = document.createElement('canvas');
        chartContainer.appendChild(ctx);
        const chartContext = ctx.getContext('2d');
        ctx.setAttribute('width', '800');
        ctx.setAttribute('height', '400');


        new Chart(chartContext, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Unsolved Problems by Tag',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 200, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Problems',
                            color: 'black',
                            font: {
                                size: 12,
                            }
                        },
                        ticks: {
                            color: 'black',

                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tags',
                            color: 'black',
                            font: {
                                size: 14,
                            },

                        },
                        ticks: {
                            color: 'black',
                            autoSkip: false,
                            maxRotation: 90,
                            minRotation: 90
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'black',
                        }
                    }
                }
            }
        });

    }
});
