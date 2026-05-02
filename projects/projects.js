import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects, fetchGitHubData } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedYear = null;

function filterBySearch(projectsGiven) {
  return projectsGiven.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function getVisibleProjects() {
  let filteredProjects = filterBySearch(projects);

  if (selectedYear !== null) {
    filteredProjects = filteredProjects.filter((project) =>
      String(project.year) === String(selectedYear)
    );
  }

  return filteredProjects;
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  let sliceGenerator = d3.pie().value(d => d.value);
  let arcData = sliceGenerator(data);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcData.forEach((d) => {
    let year = d.data.label;

    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(year))
      .attr('class', String(selectedYear) === String(year) ? 'selected' : '')
      .on('click', () => {
        selectedYear = String(selectedYear) === String(year) ? null : year;
        updatePage();
      });
  });

  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr(
        'class',
        String(selectedYear) === String(d.label)
          ? 'legend-item selected'
          : 'legend-item'
      )
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

function updatePage() {
  let searchFilteredProjects = filterBySearch(projects);
  let visibleProjects = getVisibleProjects();

  renderProjects(visibleProjects, projectsContainer, 'h2');
  renderPieChart(searchFilteredProjects);
}

renderProjects(projects, projectsContainer, 'h2');

if (projectsTitle) {
  projectsTitle.textContent = `Projects (${projects.length})`;
}

renderPieChart(projects);

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  if (selectedYear !== null) {
    let searchFilteredProjects = filterBySearch(projects);
    let availableYears = searchFilteredProjects.map(project => String(project.year));

    if (!availableYears.includes(String(selectedYear))) {
      selectedYear = null;
    }
  }

  updatePage();
});

const githubData = await fetchGitHubData('pemam238');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
    <h2>My GitHub Stats</h2>
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}