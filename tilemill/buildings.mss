// Zooms 12-18

#buildings {
  [zoom=13][area>=10000],
  [zoom=14][area>=5000],
  [zoom=15][area>=2000],
  [zoom>=16] {
    polygon-fill: @buildings;
  }
  [zoom = 16] {
    line-color: @buildings_outline_16;
  }
  [zoom > 16] {
    line-color: @buildings_outline;
  }
  [zoom >= 18] {
    [osm_id = 220254203], // Madrid
    [osm_id = 279768154], // Brooklyn
    [osm_id = 260351411]  // Stamen
    {
      ::red {
        line-width:2;
        line-color: red;
        line-offset: -8;
      }
      ::orange {
        line-width:2;
        line-color: orange;
        line-offset: -6;
      }
      ::yellow {
        line-width:2;
        line-color: yellow;
        line-offset: -4;
      }
      ::green {
        line-width:2;
        line-color: green;
        line-offset: -2;
      }
      ::blue {
        line-width:2;
        line-color: blue;
      }
      ::purple {
        line-width:2;
        line-color: purple;
        line-offset: 2;
      }
      ::halo {
        line-width:4;
        line-color: @landmass_fill;
        line-offset: 5;
      }
    }
  }
}

