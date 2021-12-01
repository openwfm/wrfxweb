export const sliderCSS = `
    <style>
        .slider {
            position: relative;
            padding-top: 5px;
            padding-bottom: 5px;
            }
            
            .slider.simulation-slider {
            width: 340px;
            }
            
            .slider.opacity-slider {
            width: 284px;
            }
            
            .slider-bar {
            height: 11px;
            background: #e8e8e8;
            border-style: solid;
            border-radius: 4px;
            border-width: .5px;
            border-color: #cccccc;
            cursor: pointer;
            }
            
            .slider-bar.simulation-slider {
            background: #d6d6d6;
            }
            
            .slider-head {
            position: absolute;
            bottom: 3px; left: 0; right: 0;
            height: 15px;
            width: 15px;
            background: #f6f6f6;
            border-style: solid; 
            border-radius: 4px;
            border-width: .5px;
            border-color: #dddddd;
            cursor: grab;
            z-index: 3000;
            }
            
            .slider-head:hover {
            border-color: black;
            }
            
            #slider-progress {
            position:absolute;
            margin: auto 0;
            top: 0; bottom: 0; left: 0; right: 0;
            width: 1%;
            background: #f8f8f8;
            border-style: solid;
            pointer-events: none;
            }
            
            #slider-marker-info {
            position: absolute;
            margin: 0 auto;
            top: 20px; bottom: 0; left: 0; right: 0;
            background: white;
            width: 160px;
            height: 20px;
            border-radius: .4rem;
            display: none;
            font-weight: bold;
            font-size: 1rem; 
            padding: 5px 5px 8px 10px;
            }
            
            #slider-marker-info.hovered { 
            display: block;
            }
            
            #slider-marker-info.clicked {
            display: block;
            }
            
            .slider-marker {
            position: absolute;
            margin: auto 0;
            top: 0; bottom: 0; left: 0; right: 0;
            background: #5d5d5d;
            width: 4px;
            height: 11px;
            border-radius: 4px;
            }
            
            #slider-end {
            left: 340px;
            }
            
            #progressBar {
                border-radius: .2rem;
                margin-top: 5px;
                background: black;
                height: 10px;
                width: 100%;
                border: none;
            }
    </style>
`;