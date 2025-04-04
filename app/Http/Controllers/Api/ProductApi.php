<?php
 
namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Http\Requests\ProductRequest;
use Illuminate\Support\Facades\Log;

class ProductApi extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            // Step 1: Get all products
            $query = Product::query();
    
    
            // Step 2: Filter by status
            if ($request->has('status')) {
                $status = $request->input('status');
                $query->where('status', $status);
            }
    
            // Step 3: Filter by price
            if ($request->has('price_from')) {
                $query->where('price', '>=', $request->input('price_from'));
            }
    
            if ($request->has('price_to')) {
                $query->where('price', '<=', $request->input('price_to'));
            }
    
            // Step 4: Filter by search
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->input('search') . '%');
            }
    
            // Step 5: Paginate (Choose how many products per page)
            if ($request->has('per_page')) {
                $perPage = $request->input('per_page');
                $query->paginate($perPage);
            }
    
            // Step 6: Sort by date added
            $query->orderBy('created_at', 'desc');
    
            // Step 7: Paginate the results (default by 10)
            $perPage = $request->input('per_page', 10);
            $products = $query->paginate($perPage)->withQueryString();
    
            // Step 8: Return the response
            return response()->json([
                'data' => $products->items(),
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'from' => $products->firstItem() ?? 0,
                    'last_page' => $products->lastPage(),
                    'links' => $products->linkCollection()->toArray(),
                    'path' => $products->path(),
                    'per_page' => $products->perPage(),
                    'to' => $products->lastItem() ?? 0,
                    'total' => $products->total(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi lấy danh sách sản phẩm'
            ], 500);
        }
    }
 
    /**
     * Store a newly created resource in storage.
     */
    public function store(ProductRequest $request)
    {
        try {
            //Step 1: Validate the request
            $validatedData = $request->validated();

            //Step 2: Check for upload folder and create if not exists
            $uploadPath = public_path('uploads');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }

            //Step 3: Generate ID
            do {
                $id = strtoupper(substr($validatedData['name'], 0, 1)) . fake()->numerify('#########');
            } while (Product::where('id', $id)->exists());

            $validatedData['id'] = $id;

            //Step 4: Upload image if exists
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $image->move($uploadPath, $imageName);
                $validatedData['image_url'] = $imageName;
            }

            //Step 4: Create product
            $validatedData['created_at'] = now();
            $validatedData['updated_at'] = now();

            Product::create($validatedData);

            //Step 5: Return response
            return response()->json([
                'message' => 'Sản phẩm đã được tạo thành công'
            ], 200);

        } catch (\Exception $e) {
            //Step 6: Return error response
            return response()->json([
                'message' => 'Lỗi khi tạo sản phẩm',
                'error' => $e->getMessage()
            ], 500);
        }
    }
 
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại'], 404);
        }
        try {
            //Step 1: Get data from request
            $data = [
                'name' => $request->input('name'),
                'description' => $request->input('description'),
                'price' => $request->input('price'),
                'quantity' => $request->input('quantity'),
                'status' => $request->input('status'),
            ];

            //Step 2: Upload image if exists
            if($request->hasFile('image')){
                $image = $request->file('image');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('uploads'), $imageName);
                $data['image_url'] = $imageName;
            }

            //Step 3: Update product
            $product->update($data);

            //Step 4: Return response
            return response()->json([
                'message' => 'Sản phẩm đã được cập nhật thành công'
            ], 200);

        } catch (\Exception $e) {
            //Step 5: Return error response
            return response()->json([
                'message' => 'Lỗi khi cập nhật sản phẩm',
                'error' => $e->getMessage()
            ], 500);
        }
    }
 
    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            //Step 1: Delete product
            $product = Product::find($id);
            if (!$product) {
                return response()->json(['message' => 'Sản phẩm không tồn tại'], 404);
            }

            //Step 2: Delete product
            $product->delete();

            //Step 3: Return response
            return response()->json([
                'message' => 'Sản phẩm đã được xóa thành công'
            ], 200);
        } catch (\Exception $e) {
            //Step 4: Return error response
            return response()->json([
                'message' => 'Lỗi khi xóa sản phẩm'
            ], 500);
        }
    }
}
