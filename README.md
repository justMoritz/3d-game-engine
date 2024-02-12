# Canvas/Color Version

I am working on a **sector-base new 3D Engine**, a direct continuation of this work here.

Please check out the  [new repo](https://github.com/justMoritz/sector-based-3d-engine) for more information!



# 3D ASCII Game Engine

![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-game-engine.gif)

## A JavaScript 3D Engine with a pure ASCII-character-based renderer!
Based on the Javidx9 code-it-yourself, but re-written and optimized in JavaScript for your browser, this is a quick rundown or the text-only 3D engine complete with mouselook, sprites, textures, lighting, water and more!

### Where can I play it?
`-->` Play it at https://3d-engine.moritz.work/ !!! `<--`

Or you can download the repo, and just open the `index.html` file in your browser!

### Who is Pogel?
Pogel is a cartoon character I invented! He's the star of many comics, cartoons, and even a previous fun [mini game project](https://scratch.mit.edu/projects/27237320/)!

# Case Study

## Starting Point
Javidx9's YouTube video titled [“Code-It-Yourself! First Person Shooter (Quick and Simple C++)”](https://www.youtube.com/watch?v=xW8skO7MFYw), it's a great and easy-to-follow tutorial for writing a raycaster game that runs in a command line terminal! It goes into much depth on the calculations, maths, and theories behind a raycaster engine, and is just honestly a really cool concept. My goal was it to adapt it for JavaScript, run it in a browser, and then take it a little further!

#### Raycasting and 3D
The first question might be…is it actually 3D? That depends. You could argue that even polygonal 3D rendering is just a 2D representation of three-dimensional space. And so is this raycaster! While it has clearly more limitations than a polygonal world, it's still in essence the illusion of a 3D world, created in 2D pixels from a set of coordinates.

## Just text on a screen
Since this game engine builds its world with nothing but mono-spaced ASCII characters, I thought it might be a lot more fun to just have the game be actual text! As a result, that's just what it is. No JavaScript canvas, no divs, just plain text!

## Looking Up and Down
One of the most obvious limitations of column-based rendering a 3D world is the absence of proper looking up and down. After all, traditional raycaster games and even early poly games like Doom had you looking straight ahead pretty much all the time.

Modern 3D games really spoil us in this regard: being able to look around freely contributes so much to an immersive, real-feeling world. And that's really hard to get un-used to. So the challenge was: Can I re-create a modern “mouselook” feel into this engine?

#### Step 1: Just Change the Height of the Ceiling and Floor
The basic concept is simple enough: When you move the mouse to look up, simply make the sky taller and the floor smaller. When looking down, make the sky smaller and the floor larger.

![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-look-1.gif)

Of course reality doesn't really look like that. You get an uncanny feeling of being “really zoomed in”, even when you are not. That's because there is no vertical perspective, you're just moving the view port up and down.

#### Step 2: Skew the Image!
We're calculating the world column by column, so there's not really a way skew a column to fake perspective. But what we *can* do is treat the entire output as an image, and skew that image!

After each frame is generated in step 1, the frame is an array of pixels, and we can now operate on a row- instead of a column-basis! We know how far up and down we are looking, so all we have to is progressively shorten each row of pixels as we look up and down, and fill it with filler-pixels at the beginning and end.

This *sounds* simple, but the math for this is still a bit tricky! While it's easy(ish) to determine how many pixels to remove from each row, figuring out how to distribute the those pixels from each row to keep the perspective intact over each scan-line required some mental gymnastics.

![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-look-2.gif)

#### Step 3: Hide the Skew!
The last thing is to run the resulting output through another loop, and cut off the left- and right-most pixels of each rown.

![Looking Up and Down Final Version](https://raw.githubusercontent.com/justMoritz/images/master/3d-look-final.gif)

*Tada! (Almost) 3d!*


## Sprites
Of course no 3D world is complete without inhabitants! 

Sprites are calculated and in their own space, and superimposed over the background world. Sprites support 4 views depending on its angle relative to the player. To determine if a sprite is behind another sprite, or a wall, a rudimentary z-buffer is used!

The characters models are adapted from my first Pogel-game, and stored as JSON in external texture-files. They loaded and placed into the world dynamically, and have basic movement logic. Moving sprites will turn 90 degrees if they hit a wall, and reverse direction when they hit the player!


## Textures, Renderer and Output Modes:
The ASCII output can run in 3 render modes: Solid Walls, Textures Only and Shaded Texture. Walls are textured with a sampler: 
- The sampler figures out which pixel to get from a texture based on which part of the texture corresponds to the wall coordinates from the game-world
- Textures can be sampled at different sizes: Blocks can have 2x (or any times) the size, and repeat textures within the block, increasing the resolution

While I like the look of ASCII characters as textures, they tend to be a illegible if rendered with really large pixels, and so I wrote in the ability to not only convert the text ASCII chars into solid solid ASCII chars, but also adjust the distance shading of those chars on depth.

![Different Render Modes Motion](https://raw.githubusercontent.com/justMoritz/images/master/3d-textures.gif)
![Different Render Modes Still](https://raw.githubusercontent.com/justMoritz/images/master/3d-rendermodes-min.png)


## Shading! (aka almost lighting)
I thought it might be kind of neat to have a—sorta—directional light source to give the whole world a little more depth. Depending on the distance from the player, each world-column is rendered at a slightly brightness. Walls facing a certain direction are shaded one step lighter than walls facing the other.

In order to re-use this for any texture, solid wall, or sprites, I wrote a method that assigns the correct depth- texture- directional values for each pixel as they are requested by the engine.

![Almost Lighting](https://raw.githubusercontent.com/justMoritz/images/master/3d-shading.gif)

The same is also true for the sprite-based characters!

## Performance Optimisations
As you can imagine, doing hundreds and thousands of trigonometrical calculations per second is extremely processor expensive, and JavaScript is not necessarily your best language for that. It's loosely typed, it's running in a browser, and while a lot of its math operations are highly optimized in modern browsers, it can still be brought to its knees rather quickly. My approach in optimizing can be broken down into caching/state-preserving, and reducing expensive loops and function calls.

- Caching and preserving certain player-, object- and world-states, such as angles, z-buffers, distance calculations. The goal is calculate everything only once!
- Frequent calculations (especially π, and various calculations involving π) are cached in constants
- Lookup-tables for some recurring calculations involving looking up and down
- Replaceing various JavaScript functions like `parseInt`, `parseFloat`, `Math.floor` etc. with bitwise operators
- Combining various operations into single loops: super-impose objects and sprites onto the background in the same output loop, instead of rendering each space on top the other


## Other Details

### Asset Loader
Because this is an entire game engine, level data and textures are loaded from files, and can be switched on the fly!

### Floor Objects
The engine also supports what I call floor objects: blocks that are neither walls nor infinite planes like ceilings and the sky. In the world they could represent water or holes, depending on their shading. They work by:
- Calculating the distance to the front *and* the back of a block.
- Overlaying and combining them onto the background-space
- Keeping them out of the z-buffer, so they don't hide sprites placed behind them!

![Objects Composite Image](https://raw.githubusercontent.com/justMoritz/images/master/3d-composit-min.png)

### Input and Output
- i/o is written from scratch! Walking, strafing, running and jumping included, and of course proper mouselook! 
- I quickly figured out that console.log-ing is super expensive. Instead, debug output is printed to a special div on screen with its own function. I always find it really interesting when you have find *other* solutions to problems that have already been solved!

### Directional Textures
At some point I decided I would make a game that took place in a grocery store. Since shelves themselves have depths, the textures for the shelves would have to have some dimension to them. My idea was to serve a different texture (with fake perspective) based on the player angel is looking at it. The effect is subtle here, but I think it really helps sell the illusion!

![Directional Textures](https://raw.githubusercontent.com/justMoritz/images/master/3d-directional.gif)

### Animated Textures:
This one is actually quite simple: Every few frames, load a different texture of a block. This code is alreay in the engine, but has not yet been implemented yet!

## Towers (WIP)
Certain blocks can be rendered taller than other blocks. This is done by rendering part of the sky as a solid. It works really nice until you start looking up and down, when it shifts, warps, and occasionally pops in and out.

![Towers](https://raw.githubusercontent.com/justMoritz/images/master/3d-towers-min.png)


![3D ASCII Game Engine](https://raw.githubusercontent.com/justMoritz/images/master/3d-game-engine-min.png)
