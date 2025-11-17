using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("Review")]
[Index("CustomerId", Name = "IX_Review_Customer")]
[Index("OrderId", Name = "IX_Review_Order")]
[Index("ProductId", Name = "IX_Review_Product")]
public partial class Review
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int CustomerId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public bool IsCommentHiddenBySeller { get; set; }

    [Precision(3)]
    public DateTime? HiddenAt { get; set; }

    [StringLength(200)]
    public string? HiddenReason { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("CustomerId")]
    [InverseProperty("Reviews")]
    public virtual Customer Customer { get; set; } = null!;

    [ForeignKey("OrderId")]
    [InverseProperty("Reviews")]
    public virtual Order Order { get; set; } = null!;

    [ForeignKey("ProductId")]
    [InverseProperty("Reviews")]
    public virtual Product Product { get; set; } = null!;
}
