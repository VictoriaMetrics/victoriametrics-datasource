// Code generated by "stringer -type=UnionMode -linecomment"; DO NOT EDIT.

package arrow

import "strconv"

func _() {
	// An "invalid array index" compiler error signifies that the constant values have changed.
	// Re-run the stringer command to generate them again.
	var x [1]struct{}
	_ = x[SparseMode-2]
	_ = x[DenseMode-3]
}

const _UnionMode_name = "SPARSEDENSE"

var _UnionMode_index = [...]uint8{0, 6, 11}

func (i UnionMode) String() string {
	i -= 2
	if i < 0 || i >= UnionMode(len(_UnionMode_index)-1) {
		return "UnionMode(" + strconv.FormatInt(int64(i+2), 10) + ")"
	}
	return _UnionMode_name[_UnionMode_index[i]:_UnionMode_index[i+1]]
}
