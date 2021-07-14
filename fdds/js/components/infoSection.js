export class InfoSection extends HTMLElement {
    constructor(header, subheaders) {
        super();
        this.innerHTML = `
            <div id='infoSectionContainer' class='infoSectionContainer'>
                <div id=${this.formatHeader(header)} class='infoSectionHeader'>
                    <h3 id='header'>
                    ${header}
                    <div id='expand-collapse' class='expand-collapse'>
                        [+]
                    </div>
                    </h3>
                </div>
                <div id='subheaders' class='hidden'>
                    <div id='generalDescription'></div>
                </div>
                <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
            </div>
        `;
        this.header = header;
        this.subheaders = subheaders;
        this.sectionDivs = {};
        this.expanded = false;
    }

    connectedCallback() {
        const header = this.querySelector('#header');
        const subsections = this.querySelector('#subheaders');
        const expandCollapse = this.querySelector('#expand-collapse');

        const expandSection = () => {
            subsections.classList.remove('hidden');
            expandCollapse.innerHTML = '[-]';
            this.expanded = true;
        }
        const contractSection = () => {
            subsections.classList.add('hidden');
            expandCollapse.innerHTML = '[+]';
            this.expanded = false;
        }

        header.onclick = () => {
            if (this.expanded) {
                contractSection();
            } else {
                expandSection();
            }
        }

        this.sectionDivs[this.header] = this.querySelector('#generalDescription');
        for (var subheader of this.subheaders) {
            var div = document.createElement('div');
            div.id = this.formatHeader(subheader);
            var h4 = document.createElement('h4');
            h4.innerHTML = subheader;
            div.appendChild(h4);
            subsections.appendChild(div);
            this.sectionDivs[subheader] = div;
        }
    }

    formatHeader(header) {
        return header.replace(' ', '-');
    }

    updateDescription(subheader, description) {
        const subSection = this.sectionDivs[subheader];
        if (subSection == null) {
            return;
        }
        var p = document.createElement('p');
        p.innerHTML = description;
        subSection.appendChild(p);
    }
}

window.customElements.define('info-section', InfoSection);