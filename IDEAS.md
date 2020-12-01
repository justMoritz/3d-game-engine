5# Todo

- Working collision detection
- aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaassad (lol)

- Asset Loader function
  + will read asset, will remove whitespace, will determine height and width
  + write into asset-object (with content, height width)
  + re-write code that uses assets
  + assets include map, sprites, textures

- Add sprites
- Make textures


# Thoughts:

### Objects/sprites

1. screen (currently rendered) should be background layer only.
2. add another layer for objects.
3. Object layer pixel-coordinates will overwrite bylayer coordinates at render
4. Need to figure out if objects are behind walls, can set a flag?




  var map = "";
  map += "#############..##############..#";
  map += "#...........#..##...........#..#";
  map += "#...........#...............#..#";
  map += "#...........#...............#..#";
  map += "#########...#...............#..#";
  map += "#..............................#";
  map += "#..............................#";
  map += "#.....................TTTT.....#";
  map += "#.....................TTTT......#";
  map += "#..............................#";
  map += "#.......................########";
  map += "#..............................#";
  map += "#..............................#";
  map += "#..............................#";
  map += "#..............................#";
  map += "#########..........T############";
  map += "#..................#...........#";
  map += "#..................#........#..#";
  map += "#..................#........#..#";
  map += "#..................#........#..#";
  map += "#########..........#........#..#";
  map += "#..............................#";
  map += "#..............................#";
  map += "#.....................####.....#";
  map += "#......................##......#";
  map += "#..............................#";
  map += "#.......................########";
  map += "#..............................#";
  map += "#..............................#";
  map += "#..............................#";
  map += "#..............................#";
  map += "#####TXT...........T############";
