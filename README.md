# Twisty Puzzle game

The objective of this project is to make a [Twisty Puzzle](https://en.wikipedia.org/wiki/Combination_puzzle) game that 
can be extended to include many types of puzzles.

## General design

Each puzzle is defined by a list of faces and rotations.

 - Each face is defined by a list of stickers that make up that face
 - Each rotation is defined by an axis of rotation, a lambda that evaluates which stickers are part of the rotation, 
and a number of positions that the rotation can take.

## Future design

 - It would be nice to be able to group the stickers by "piece".
 - If we could find a way to detect whether a move is restricted, we could support bandages puzzles 
(and bandages-adjacent, like the [Square-1](https://en.wikipedia.org/wiki/Square-1_(puzzle)))
 - For now, the axis of rotations can only be defined from the origin.