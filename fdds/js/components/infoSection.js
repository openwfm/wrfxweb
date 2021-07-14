export class InfoSection extends HTMLElement {
    constructor(header, subheaders) {
        super();
        this.innerHTML = `
            <div id='infoSectionContainer'>
                <h3>${header}</h3>
                <div id=${this.formatHeader(header)}></div>
                <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
            </div>
        `;
        // this.subheaders = subheaders.map(subheader => this.formatHeader(subheader));
        this.subheaders = subheaders;
    }

    connectedCallback() {
        const infoSection = this.querySelector('#infoSectionContainer');
        const sectionBreak = this.querySelector('#break');
        for (var subheader of this.subheaders) {
            var div = document.createElement('div');
            div.id = this.formatHeader(subheader);
            var h4 = document.createElement('h4');
            h4.innerHTML = subheader;
            div.appendChild(h4);
            infoSection.insertBefore(div, sectionBreak);
        }
    }

    formatHeader(header) {
        return header.replace(' ', '-');
    }

    updateDescription(subheader, description) {
        var formattedSubheader = this.formatHeader(subheader);
        const subSection = this.querySelector('#' + formattedSubheader);
        if (subSection == null) {
            return;
        }
        var p = document.createElement('div');
        p.innerHTML = description;
        subSection.appendChild(p);
    }
}

window.customElements.define('info-section', InfoSection);